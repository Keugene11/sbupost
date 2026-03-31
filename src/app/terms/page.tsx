import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-[28px] font-extrabold mb-6">Terms of Service</h1>
      <p className="text-[13px] text-text-muted mb-4">Last updated: March 30, 2026</p>

      <div className="space-y-6 text-[14px] leading-relaxed">
        <section>
          <h2 className="font-bold text-[16px] mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using SBUPost ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. We may update these terms from time to time, and continued use of the Service constitutes acceptance of any changes.</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">2. Account Eligibility</h2>
          <p>To use SBUPost, you must be at least 17 years of age and a current or former student, faculty member, or staff member of Stony Brook University. By creating an account, you represent and warrant that you meet these eligibility requirements. Accounts created with false or misleading information may be terminated without notice.</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">3. Acceptable Use Policy</h2>
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Harass, bully, threaten, or intimidate other users</li>
            <li>Post hate speech, discriminatory content, or content that promotes violence</li>
            <li>Send spam, unsolicited advertisements, or chain messages</li>
            <li>Post illegal content or content that violates any applicable law</li>
            <li>Impersonate another person or entity</li>
            <li>Share another person&apos;s private information without their consent</li>
            <li>Upload malware, viruses, or other harmful software</li>
            <li>Attempt to gain unauthorized access to other user accounts or the Service&apos;s infrastructure</li>
            <li>Use the Service for any commercial purpose without our prior written consent</li>
            <li>Interfere with or disrupt the Service or its servers</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">4. User Content</h2>
          <p>You retain ownership of the content you post on SBUPost. By posting content, you grant SBUPost a non-exclusive, royalty-free, worldwide license to use, display, reproduce, and distribute your content in connection with operating and providing the Service. You are solely responsible for the content you post and the consequences of sharing it.</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">5. Privacy</h2>
          <p>Your use of the Service is also governed by our <Link href="/privacy" className="text-accent font-semibold underline">Privacy Policy</Link>, which describes how we collect, use, and share your information. By using the Service, you consent to our collection and use of data as described in the Privacy Policy.</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">6. Content Moderation</h2>
          <p>We reserve the right, but are not obligated, to review, monitor, and remove any content posted on the Service at our sole discretion. We may remove content that violates these Terms, is harmful, objectionable, or otherwise inappropriate. We may also suspend or terminate accounts that repeatedly violate these Terms or engage in behavior that is detrimental to the community.</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">7. Messaging</h2>
          <p>The Service provides direct messaging features between users. You agree not to use messaging to send unsolicited spam, advertisements, or promotional material. You agree not to use messaging to harass, threaten, or send abusive content to other users. Violations may result in messaging restrictions or account termination.</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">8. Account Termination</h2>
          <p>We may suspend or terminate your account at any time, with or without notice, for conduct that we determine violates these Terms, is harmful to other users or the Service, or for any other reason at our sole discretion. You may also delete your own account at any time through the app settings. Upon termination, your right to use the Service will immediately cease.</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">9. Disclaimers</h2>
          <p>The Service is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, secure, or error-free. SBUPost is not affiliated with or endorsed by Stony Brook University.</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">10. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, SBUPost and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">11. Contact</h2>
          <p>For questions about these Terms of Service, contact us at <a href="mailto:support@sbupost.app" className="text-accent font-semibold underline">support@sbupost.app</a>.</p>
        </section>
      </div>
    </div>
  )
}
