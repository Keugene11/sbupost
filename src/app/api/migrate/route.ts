import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  if (secret !== process.env.ADMIN_ACTION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "public" } }
  )

  // Test: try updating a post with is_approved field
  // If the column doesn't exist, this will fail
  const { error: testError } = await admin
    .from("posts")
    .select("is_approved")
    .limit(1)

  if (testError) {
    return NextResponse.json({
      status: "columns_missing",
      error: testError.message,
      instructions: "Run this SQL in Supabase SQL Editor: ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE; ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE; UPDATE posts SET is_approved = TRUE; UPDATE messages SET is_approved = TRUE;"
    })
  }

  // Columns exist — approve all existing content
  const { error: e1 } = await admin
    .from("posts")
    .update({ is_approved: true })
    .eq("is_approved", false)

  const { error: e2 } = await admin
    .from("messages")
    .update({ is_approved: true })
    .eq("is_approved", false)

  return NextResponse.json({
    status: "done",
    posts_error: e1?.message || null,
    messages_error: e2?.message || null,
  })
}
