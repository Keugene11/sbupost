import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Delete user data first (cascading deletes should handle most)
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', user.id)
    if (profileError) {
      return NextResponse.json({ error: 'Failed to delete user data' }, { status: 500 })
    }

    // Delete auth user using admin client
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error: authError } = await adminClient.auth.admin.deleteUser(user.id)
    if (authError) {
      return NextResponse.json({ error: 'Failed to delete auth user' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
