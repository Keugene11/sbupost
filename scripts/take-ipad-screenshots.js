const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'public', 'screenshots');
const VIEWPORT = { width: 1024, height: 1366, deviceScaleFactor: 2 };
const BASE_URL = 'https://sbupost.vercel.app';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function navigateAndScreenshot(page, url, filename) {
  console.log(`Taking screenshot: ${filename}...`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(5000); // Wait for client-side rendering and data fetching
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, filename),
      fullPage: false,
    });
    console.log(`  Saved ${filename}`);
    return true;
  } catch (err) {
    console.error(`  Failed ${filename}: ${err.message}`);
    return false;
  }
}

async function takeScreenshots() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  const successfulScreenshots = [];
  const failedScreenshots = [];

  try {
    // Step 1: Navigate to login
    console.log('Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(2000);

    // Step 2: Fill in credentials and log in
    console.log('Logging in...');
    await page.type('input[type="email"]', 'testuser@sbupost.app', { delay: 30 });
    await page.type('input[type="password"]', 'TestUser123!', { delay: 30 });

    // Click the Log In button
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);

    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    if (!currentUrl.includes('/feed')) {
      await delay(3000);
      if (!page.url().includes('/feed')) {
        throw new Error(`Login failed. Current URL: ${page.url()}`);
      }
    }

    // Wait for feed content to load
    await delay(5000);

    // Screenshot 1: Feed page (already here)
    console.log('Taking screenshot: ipad_1.png (Feed)...');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'ipad_1.png'),
      fullPage: false,
    });
    console.log('  Saved ipad_1.png');
    successfulScreenshots.push('ipad_1.png');

    // Screenshot 2: Profile
    if (await navigateAndScreenshot(page, `${BASE_URL}/profile`, 'ipad_2.png')) {
      successfulScreenshots.push('ipad_2.png');
    } else {
      failedScreenshots.push({ file: 'ipad_2.png', title: 'Your Profile', subtitle: 'Track your posts and engagement' });
    }

    // Screenshot 3: Search
    if (await navigateAndScreenshot(page, `${BASE_URL}/search`, 'ipad_3.png')) {
      successfulScreenshots.push('ipad_3.png');
    } else {
      failedScreenshots.push({ file: 'ipad_3.png', title: 'Discover', subtitle: 'Search posts and find people' });
    }

    // Screenshot 4: Messages
    if (await navigateAndScreenshot(page, `${BASE_URL}/messages`, 'ipad_4.png')) {
      successfulScreenshots.push('ipad_4.png');
    } else {
      failedScreenshots.push({ file: 'ipad_4.png', title: 'Messages', subtitle: 'Chat with fellow Seawolves' });
    }
  } catch (err) {
    console.error('Login/navigation error:', err.message);
    // All screenshots failed - create all as placeholders
    failedScreenshots.push(
      { file: 'ipad_1.png', title: 'Your Campus Feed', subtitle: 'Stay connected with Stony Brook' },
      { file: 'ipad_2.png', title: 'Your Profile', subtitle: 'Track your posts and engagement' },
      { file: 'ipad_3.png', title: 'Discover', subtitle: 'Search posts and find people' },
      { file: 'ipad_4.png', title: 'Messages', subtitle: 'Chat with fellow Seawolves' },
    );
  }

  await browser.close();

  // Create placeholders for any failed screenshots
  if (failedScreenshots.length > 0) {
    console.log(`\nCreating ${failedScreenshots.length} placeholder(s) with sharp...`);
    await createPlaceholderScreenshots(failedScreenshots);
  }

  // Verify all screenshots
  console.log('\nFinal results:');
  for (let i = 1; i <= 4; i++) {
    const filePath = path.join(SCREENSHOT_DIR, `ipad_${i}.png`);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const type = successfulScreenshots.includes(`ipad_${i}.png`) ? 'live' : 'placeholder';
      console.log(`  ipad_${i}.png: ${(stats.size / 1024).toFixed(0)} KB (${type})`);
    } else {
      console.log(`  ipad_${i}.png: MISSING`);
    }
  }
}

async function createPlaceholderScreenshots(screens) {
  const sharp = require('sharp');

  const WIDTH = 2048;
  const HEIGHT = 2732;

  for (const screen of screens) {
    console.log(`  Creating placeholder: ${screen.file}...`);

    const svg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
      <text x="${WIDTH / 2}" y="${HEIGHT / 2 - 200}" text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif" font-size="120" font-weight="800"
        fill="white" letter-spacing="-2">SBUPost</text>
      <text x="${WIDTH / 2}" y="${HEIGHT / 2 - 40}" text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="700"
        fill="white">${screen.title}</text>
      <text x="${WIDTH / 2}" y="${HEIGHT / 2 + 60}" text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="400"
        fill="#999999">${screen.subtitle}</text>
      <text x="${WIDTH / 2}" y="${HEIGHT / 2 + 200}" text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="400"
        fill="#666666">The social network for Stony Brook University</text>
    </svg>`;

    await sharp(Buffer.from(svg))
      .resize(WIDTH, HEIGHT)
      .png()
      .toFile(path.join(SCREENSHOT_DIR, screen.file));
  }
}

takeScreenshots().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
