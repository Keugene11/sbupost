import { createClient } from "@/lib/supabase/server"
import { sendAdminEmail } from "@/lib/email"
import { NextRequest, NextResponse } from "next/server"

const BASE_URL = "https://sbupost.vercel.app"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { post_id, content } = await req.json()
  if (!post_id) {
    return NextResponse.json({ error: "post_id required" }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()

  const authorName = profile?.full_name || "Someone"
  const preview = content?.slice(0, 200) || "(no content)"
  const secret = process.env.ADMIN_ACTION_SECRET
  const approveUrl = `${BASE_URL}/api/admin/email-action?secret=${secret}&action=approve&type=post&id=${post_id}`
  const rejectUrl = `${BASE_URL}/api/admin/email-action?secret=${secret}&action=reject&type=post&id=${post_id}`

  try {
    await sendAdminEmail(`New post from ${authorName}`, `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="margin: 0 0 8px;">New post pending approval</h2>
        <p style="margin: 0 0 4px;"><strong>${authorName}</strong> just posted:</p>
        <blockquote style="margin: 12px 0; padding: 12px 16px; background: #f5f5f5; border-radius: 8px; border-left: 3px solid #333;">
          ${preview}
        </blockquote>
        <div style="margin-top: 16px;">
          <a href="${approveUrl}" style="display: inline-block; padding: 10px 24px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 20px; font-size: 14px; font-weight: 600;">
            Approve
          </a>
          &nbsp;&nbsp;
          <a href="${rejectUrl}" style="display: inline-block; padding: 10px 24px; background: #fff; color: #dc2626; text-decoration: none; border-radius: 20px; font-size: 14px; font-weight: 600; border: 2px solid #dc2626;">
            Reject
          </a>
        </div>
      </div>
    `)
  } catch {
    // Don't fail the request if email fails
  }

  return NextResponse.json({ ok: true })
}
