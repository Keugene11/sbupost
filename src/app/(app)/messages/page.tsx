'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

interface ConversationWithProfile {
  id: string
  user1_id: string
  user2_id: string
  last_message_at: string
  other_user: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  last_message?: string
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const supabase = useRef(createClient()).current

  const fetchConversations = useCallback(async () => {
    try {
      setError(false)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('conversations')
        .select(`
          id, user1_id, user2_id, last_message_at,
          user1:profiles!conversations_user1_id_fkey(id, full_name, avatar_url),
          user2:profiles!conversations_user2_id_fkey(id, full_name, avatar_url)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      if (data) {
        const convos: ConversationWithProfile[] = []
        for (const c of data) {
          const otherUser = c.user1_id === user.id ? c.user2 : c.user1
          // Fetch last visible message
          const ADMIN_EMAILS = ['keugenelee11@gmail.com']
          const isAdmin = ADMIN_EMAILS.includes(user.email || '')
          let lastMsgQuery = supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1)

          if (!isAdmin) {
            lastMsgQuery = lastMsgQuery.or(`is_approved.eq.true,sender_id.eq.${user.id}`)
          }

          const { data: msgs } = await lastMsgQuery

          convos.push({
            id: c.id,
            user1_id: c.user1_id,
            user2_id: c.user2_id,
            last_message_at: c.last_message_at,
            other_user: otherUser as unknown as { id: string; full_name: string; avatar_url: string | null },
            last_message: msgs?.[0]?.content,
          })
        }
        setConversations(convos)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    )
  }

  return (
    <div className="max-w-md md:max-w-xl mx-auto px-4 pt-6">
      <h1 className="text-[24px] font-extrabold tracking-tight mb-4">Messages</h1>

      {error ? (
        <div className="text-center py-12">
          <p className="text-text-muted text-[14px] mb-3">Failed to load conversations.</p>
          <button onClick={fetchConversations} className="text-[14px] font-semibold text-accent press">Tap to retry</button>
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-[14px]">
          No conversations yet. Visit someone&apos;s profile to start a chat!
        </div>
      ) : (
        <div className="space-y-2 stagger">
          {conversations.map((convo) => (
            <Link
              key={convo.id}
              href={`/messages/${convo.id}`}
              className="flex items-center gap-3 bg-bg-card border border-border rounded-2xl px-4 py-3 hover:bg-bg-card-hover transition-colors press"
            >
              {convo.other_user.avatar_url ? (
                <Image
                  src={convo.other_user.avatar_url}
                  alt=""
                  width={44}
                  height={44}
                  className="rounded-full w-11 h-11 object-cover"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-bg-input flex items-center justify-center shrink-0">
                  <User size={20} className="text-text-muted" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[14px] truncate">
                    {convo.other_user.full_name || 'Anonymous'}
                  </p>
                  <span className="text-[11px] text-text-muted shrink-0">
                    {formatDistanceToNow(new Date(convo.last_message_at), { addSuffix: true })}
                  </span>
                </div>
                {convo.last_message && (
                  <p className="text-[13px] text-text-muted truncate">{convo.last_message}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
