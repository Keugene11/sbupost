'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, MessageSquare } from 'lucide-react'
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

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-[52px] h-[52px] rounded-full bg-bg-input animate-pulse shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 bg-bg-input rounded-full animate-pulse" />
          <div className="h-3 w-12 bg-bg-input rounded-full animate-pulse" />
        </div>
        <div className="h-3.5 w-44 bg-bg-input rounded-full animate-pulse" />
      </div>
    </div>
  )
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useRef(createClient()).current

  const fetchConversations = useCallback(async () => {
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
      // Fetch all last messages in parallel (fixes N+1 query bug)
      const lastMessages = await Promise.all(
        data.map((c) =>
          supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1)
        )
      )

      const convos: ConversationWithProfile[] = data.map((c, i) => {
        const otherUser = c.user1_id === user.id ? c.user2 : c.user1
        return {
          id: c.id,
          user1_id: c.user1_id,
          user2_id: c.user2_id,
          last_message_at: c.last_message_at,
          other_user: otherUser as unknown as { id: string; full_name: string; avatar_url: string | null },
          last_message: lastMessages[i]?.data?.[0]?.content,
        }
      })

      setConversations(convos)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4">
      <h1 className="text-[28px] font-extrabold tracking-tight mb-1">Messages</h1>
      <p className="text-[13px] text-text-muted mb-5">Your conversations</p>

      {loading ? (
        <div className="divide-y divide-border/50">
          {Array.from({ length: 6 }).map((_, i) => (
            <ConversationSkeleton key={i} />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-bg-input flex items-center justify-center mb-4">
            <MessageSquare size={28} className="text-text-muted" />
          </div>
          <p className="text-[16px] font-semibold text-text mb-1">No messages yet</p>
          <p className="text-[13px] text-text-muted text-center max-w-[240px]">
            Visit someone&apos;s profile to start a conversation
          </p>
        </div>
      ) : (
        <div className="stagger">
          {conversations.map((convo) => (
            <Link
              key={convo.id}
              href={`/messages/${convo.id}`}
              className="flex items-center gap-3 px-4 py-3.5 -mx-4 hover:bg-bg-card-hover transition-colors press active:bg-bg-card-hover"
            >
              {convo.other_user.avatar_url ? (
                <Image
                  src={convo.other_user.avatar_url}
                  alt=""
                  width={52}
                  height={52}
                  className="rounded-full w-[52px] h-[52px] object-cover shrink-0"
                />
              ) : (
                <div className="w-[52px] h-[52px] rounded-full bg-bg-input flex items-center justify-center shrink-0">
                  <User size={22} className="text-text-muted" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-semibold text-[15px] truncate">
                    {convo.other_user.full_name || 'Anonymous'}
                  </p>
                  <span className="text-[12px] text-text-muted shrink-0 ml-2">
                    {formatDistanceToNow(new Date(convo.last_message_at), { addSuffix: false })}
                  </span>
                </div>
                <p className="text-[14px] text-text-muted truncate">
                  {convo.last_message || 'No messages yet'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
