const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEY_ID = 'V9LPBAY24H';
const TEAM_ID = 'SDA728W6D9';
const privateKey = fs.readFileSync('C:/Users/Daniel/Downloads/AuthKey_' + KEY_ID + '.p8', 'utf8');

const now = Math.floor(Date.now() / 1000);
const header = JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' });
const payload = JSON.stringify({ iss: TEAM_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' });
const b64 = s => Buffer.from(s).toString('base64url');
const input = b64(header) + '.' + b64(payload);
const sig = crypto.sign('SHA256', Buffer.from(input), { key: privateKey, dsaEncoding: 'ieee-p1363' });
const TOKEN = input + '.' + sig.toString('base64url');

async function api(method, endpoint, body) {
  const url = 'https://api.appstoreconnect.apple.com/v1' + endpoint;
  const opts = { method, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

async function main() {
  const apps = await api('GET', '/apps?filter[bundleId]=com.sbupost.app');
  if (!apps.data || !apps.data.length) { console.log('App not found'); return; }
  const appId = apps.data[0].id;
  console.log('App ID:', appId);

  const versions = await api('GET', '/apps/' + appId + '/appStoreVersions?filter[appStoreState]=PREPARE_FOR_SUBMISSION');
  const versionId = versions.data[0].id;
  console.log('Version ID:', versionId);

  // 1. Copyright
  console.log('\n--- Setting copyright ---');
  const cr = await api('PATCH', '/appStoreVersions/' + versionId, {
    data: { type: 'appStoreVersions', id: versionId, attributes: { copyright: '2026 Keugene Lee' } }
  });
  console.log(cr.data ? 'OK' : JSON.stringify(cr).slice(0, 300));

  // 2. Review credentials
  console.log('\n--- Setting review credentials ---');
  const existing = await api('GET', '/appStoreVersions/' + versionId + '/appStoreReviewDetail');
  const reviewAttrs = {
    contactFirstName: 'Keugene',
    contactLastName: 'Lee',
    contactEmail: 'keugenelee11@gmail.com',
    contactPhone: '+1 631 555 0100',
    demoAccountName: 'testuser@sbupost.app',
    demoAccountPassword: 'TestUser123!',
    demoAccountRequired: true,
    notes: 'Use the provided demo account to log in via email/password. The app is a social network for Stony Brook University students.'
  };

  if (existing.data) {
    const r = await api('PATCH', '/appStoreReviewDetails/' + existing.data.id, {
      data: { type: 'appStoreReviewDetails', id: existing.data.id, attributes: reviewAttrs }
    });
    console.log(r.data ? 'OK (updated)' : JSON.stringify(r).slice(0, 300));
  } else {
    const r = await api('POST', '/appStoreReviewDetails', {
      data: { type: 'appStoreReviewDetails', attributes: reviewAttrs,
        relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: versionId } } }
      }
    });
    console.log(r.data ? 'OK (created)' : JSON.stringify(r).slice(0, 300));
  }

  // 3. Content rights
  console.log('\n--- Setting content rights ---');
  const appInfos = await api('GET', '/apps/' + appId + '/appInfos');
  if (appInfos.data && appInfos.data.length > 0) {
    const appInfoId = appInfos.data[0].id;
    // Try setting content rights declaration
    const crResult = await api('PATCH', '/appInfos/' + appInfoId, {
      data: { type: 'appInfos', id: appInfoId, attributes: {} }
    });
    console.log('App info:', JSON.stringify(crResult.data?.attributes || crResult).slice(0, 300));
  }

  // 4. Find available iPad screenshot types
  console.log('\n--- Uploading 13-inch iPad screenshots ---');
  const locale = await api('GET', '/appStoreVersions/' + versionId + '/appStoreVersionLocalizations');
  const localeId = locale.data[0].id;

  // List current sets
  const sets = await api('GET', '/appStoreVersionLocalizations/' + localeId + '/appScreenshotSets');
  console.log('Current sets:', sets.data?.map(s => s.attributes.screenshotDisplayType).join(', '));

  // Try different iPad 13" type identifiers
  const ipadTypes = ['APP_IPAD_PRO_3GEN_129', 'APP_IPAD_13', 'APP_IPAD_PRO_129_3RD_GEN', 'APP_IPAD_PRO_6GEN_129'];

  for (const ipadType of ipadTypes) {
    // Skip if already exists
    if (sets.data?.some(s => s.attributes.screenshotDisplayType === ipadType)) {
      console.log(ipadType, 'already exists, checking screenshots...');
      const existingSet = sets.data.find(s => s.attributes.screenshotDisplayType === ipadType);
      const existingScreenshots = await api('GET', '/appScreenshotSets/' + existingSet.id + '/appScreenshots');
      console.log(ipadType, 'has', existingScreenshots.data?.length || 0, 'screenshots');
      continue;
    }

    console.log('Creating set for', ipadType + '...');
    const newSet = await api('POST', '/appScreenshotSets', {
      data: {
        type: 'appScreenshotSets',
        attributes: { screenshotDisplayType: ipadType },
        relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: localeId } } }
      }
    });

    if (newSet.data) {
      console.log('Created:', ipadType);
      // Upload screenshots
      for (let i = 1; i <= 4; i++) {
        const filePath = path.join('public', 'screenshots', 'ipad_' + i + '.png');
        if (!fs.existsSync(filePath)) continue;

        const fileData = fs.readFileSync(filePath);
        const checksum = crypto.createHash('md5').update(fileData).digest('base64');

        const reserve = await api('POST', '/appScreenshots', {
          data: {
            type: 'appScreenshots',
            attributes: { fileName: 'ipad_' + i + '.png', fileSize: fileData.length },
            relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: newSet.data.id } } }
          }
        });

        if (!reserve.data) { console.log('Reserve failed for', filePath); continue; }

        const ops = reserve.data.attributes.uploadOperations || [];
        for (const op of ops) {
          const headers = {};
          for (const h of op.requestHeaders || []) headers[h.name] = h.value;
          await fetch(op.url, { method: 'PUT', headers, body: fileData.subarray(op.offset, op.offset + op.length) });
        }

        await api('PATCH', '/appScreenshots/' + reserve.data.id, {
          data: { type: 'appScreenshots', id: reserve.data.id, attributes: { uploaded: true, sourceFileChecksum: checksum } }
        });
        console.log('Uploaded', filePath);
      }
      break; // Stop after first successful type
    } else {
      console.log(ipadType, 'failed:', JSON.stringify(newSet).slice(0, 200));
    }
  }

  // 5. Delete stuck review submissions
  console.log('\n--- Cleaning review submissions ---');
  const subs = await api('GET', '/apps/' + appId + '/reviewSubmissions');
  console.log('Found', subs.data?.length || 0, 'submissions');
  if (subs.data) {
    for (const sub of subs.data) {
      console.log('  State:', sub.attributes.state);
      if (sub.attributes.state !== 'IN_REVIEW' && sub.attributes.state !== 'COMPLETE') {
        // Try cancel then delete
        await api('PATCH', '/reviewSubmissions/' + sub.id, {
          data: { type: 'reviewSubmissions', id: sub.id, attributes: { canceled: true } }
        });
        const del = await api('DELETE', '/reviewSubmissions/' + sub.id);
        console.log('  Deleted:', typeof del === 'string' && del === '' ? 'yes' : 'no');
      }
    }
  }

  console.log('\nDone!');
}

main().catch(e => console.error(e));
