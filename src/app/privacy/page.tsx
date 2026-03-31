export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-[28px] font-extrabold mb-6">Privacy Policy</h1>
      <p className="text-[13px] text-text-muted mb-4">Last updated: March 30, 2026</p>

      <div className="space-y-6 text-[14px] leading-relaxed">
        <section>
          <h2 className="font-bold text-[16px] mb-2">1. Information We Collect</h2>
          <p>When you create an account on SBUPost, we collect your email address, name, and profile information you choose to provide (major, courses, residence hall, etc.). We also collect content you post, messages you send, and interactions (likes, comments, follows).</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">2. How We Use Your Information</h2>
          <p>We use your information to provide and improve the SBUPost service, display your profile to other users, deliver notifications, and enable messaging between users.</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">3. Information Sharing</h2>
          <p>Your profile information and posts are visible to other authenticated SBUPost users. We do not sell your personal information to third parties. We may share information if required by law.</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">4. Data Storage</h2>
          <p>Your data is stored securely using Supabase (hosted on AWS). Images and videos are stored in secure cloud storage.</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">5. Your Rights</h2>
          <p>You can update or delete your profile information at any time. You can delete your posts and comments. To delete your account entirely, visit the Account Deletion page within the app or at sbupost.vercel.app/delete-account. Account deletion is permanent and removes all your data including posts, comments, messages, and profile information.</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">6. Contact</h2>
          <p>For questions about this privacy policy, contact us at support@sbupost.app.</p>
        </section>
      </div>
    </div>
  )
}
