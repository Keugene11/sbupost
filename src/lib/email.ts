import nodemailer from "nodemailer"

const ADMIN_EMAIL = "keugenelee11@gmail.com"

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: ADMIN_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendAdminEmail(subject: string, html: string) {
  await transporter.sendMail({
    from: `SBUPost <${ADMIN_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject,
    html,
  })
}
