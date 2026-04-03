import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  const action = req.nextUrl.searchParams.get("action")
  const type = req.nextUrl.searchParams.get("type")
  const id = req.nextUrl.searchParams.get("id")

  if (secret !== process.env.ADMIN_ACTION_SECRET) {
    return new NextResponse(page("Unauthorized", "Invalid token."), {
      status: 403,
      headers: { "Content-Type": "text/html" },
    })
  }

  if (!action || !type || !id) {
    return new NextResponse(page("Bad Request", "Missing parameters."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (type === "post") {
    if (action === "approve") {
      await admin.from("posts").update({ is_approved: true }).eq("id", id)
      return new NextResponse(page("Post Approved", "The post is now visible to everyone."), {
        headers: { "Content-Type": "text/html" },
      })
    } else if (action === "reject") {
      await admin.from("comments").delete().eq("post_id", id)
      await admin.from("likes").delete().eq("post_id", id)
      await admin.from("post_impressions").delete().eq("post_id", id)
      await admin.from("posts").delete().eq("id", id)
      return new NextResponse(page("Post Rejected", "The post has been deleted."), {
        headers: { "Content-Type": "text/html" },
      })
    }
  } else if (type === "dm") {
    if (action === "approve") {
      await admin.from("messages").update({ is_approved: true }).eq("id", id)
      return new NextResponse(page("Message Approved", "The message is now visible to the recipient."), {
        headers: { "Content-Type": "text/html" },
      })
    } else if (action === "reject") {
      await admin.from("messages").delete().eq("id", id)
      return new NextResponse(page("Message Deleted", "The DM has been removed."), {
        headers: { "Content-Type": "text/html" },
      })
    }
  }

  return new NextResponse(page("Unknown Action", "Nothing happened."), {
    status: 400,
    headers: { "Content-Type": "text/html" },
  })
}

function page(title: string, message: string) {
  return `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — SBUPost</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fafafa}
.card{text-align:center;padding:40px;max-width:360px}
h1{font-size:22px;margin:0 0 8px}p{color:#666;font-size:15px}</style>
</head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`
}
