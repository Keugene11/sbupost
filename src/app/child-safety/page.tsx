export default function ChildSafetyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-[28px] font-extrabold mb-6">Child Safety Standards</h1>
      <p className="text-[13px] text-text-muted mb-4">Last updated: March 30, 2026</p>

      <div className="space-y-6 text-[14px] leading-relaxed">
        <section>
          <h2 className="font-bold text-[16px] mb-2">1. Our Commitment</h2>
          <p>SBUPost has zero tolerance for child sexual abuse and exploitation (CSAE) content. We are committed to preventing the creation, distribution, and storage of child sexual abuse material (CSAM) on our platform.</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">2. Prevention Measures</h2>
          <p>We implement the following measures to prevent CSAE on our platform:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>All users must be at least 17 years old to create an account</li>
            <li>User-generated content is subject to our community guidelines and acceptable use policy</li>
            <li>Users can report inappropriate content directly within the app</li>
            <li>Reported content is reviewed and actioned promptly</li>
            <li>Accounts found violating these standards are immediately suspended and permanently banned</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">3. Reporting</h2>
          <p>If you encounter any content that depicts, promotes, or facilitates child sexual abuse or exploitation, please take the following steps:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Use the in-app report feature (flag icon) to report the content immediately</li>
            <li>Contact us directly at <a href="mailto:keugenelee11@gmail.com" className="text-accent underline">keugenelee11@gmail.com</a></li>
            <li>Report to the National Center for Missing & Exploited Children (NCMEC) at <a href="https://www.missingkids.org/gethelpnow/cybertipline" className="text-accent underline">CyberTipline.org</a></li>
            <li>Contact local law enforcement</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">4. Enforcement</h2>
          <p>When CSAE content is identified or reported:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>The content is immediately removed from the platform</li>
            <li>The offending account is permanently banned</li>
            <li>We report the incident to NCMEC and relevant law enforcement authorities as required by law</li>
            <li>We preserve relevant evidence as required by law enforcement</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">5. Contact</h2>
          <p>For questions about our child safety practices or to report concerns, contact us at <a href="mailto:keugenelee11@gmail.com" className="text-accent underline">keugenelee11@gmail.com</a>.</p>
        </section>
      </div>
    </div>
  )
}
