export default function DeleteAccountPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-[28px] font-extrabold mb-6">Delete Your Account</h1>

      <div className="space-y-6 text-[14px] leading-relaxed">
        <section>
          <h2 className="font-bold text-[16px] mb-2">How to Delete Your Account</h2>
          <p>To request deletion of your SBUPost account and all associated data, please follow these steps:</p>
          <ol className="list-decimal ml-5 mt-2 space-y-2">
            <li>Send an email to <strong>keugenelee11@gmail.com</strong> from the email address associated with your account.</li>
            <li>Use the subject line: <strong>Account Deletion Request</strong></li>
            <li>Include your full name and the email you used to sign up.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">What Data Will Be Deleted</h2>
          <p>When your account is deleted, the following data will be permanently removed:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Your profile information (name, bio, major, courses, etc.)</li>
            <li>All your posts and uploaded images/videos</li>
            <li>Your comments and likes</li>
            <li>Your messages and conversations</li>
            <li>Your follower and following relationships</li>
            <li>Your notification history</li>
            <li>Profile view records</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">Timeline</h2>
          <p>Account deletion requests are processed within <strong>30 days</strong>. Once deleted, your data cannot be recovered.</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">Contact</h2>
          <p>For questions, email <strong>keugenelee11@gmail.com</strong></p>
        </section>
      </div>
    </div>
  )
}
