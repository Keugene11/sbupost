'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/types'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, Loader2, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface OtherUser {
  id: string
  full_name: string
  avatar_url: string | null
}

export default function ChatPage() {
  const { id: conversationId } = useParams<{ id: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = useRef(createClient()).current
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    // Get conversation details
    const { data: convo } = await supabase
      .from('conversations')
      .select(`
        user1_id, user2_id,
        user1:profiles!conversations_user1_id_fkey(id, full_name, avatar_url),
        user2:profiles!conversations_user2_id_fkey(id, full_name, avatar_url)
      `)
      .eq('id', conversationId)
      .single()

    if (convo) {
      const other = convo.user1_id === user.id ? convo.user2 : convo.user1
      setOtherUser(other as unknown as OtherUser)
    }

    // Get messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (msgs) setMessages(msgs)
    setLoading(false)
  }, [supabase, conversationId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, conversationId])

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUserId) return
    setSending(true)

    const messageContent = newMessage.trim()
    setNewMessage('')

    // Optimistic update
    const tempMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: messageContent,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: messageContent,
    })

    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)

    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto flex flex-col" style={{ height: 'calc(100dvh - 4rem)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-bg sticky top-0 z-10">
        <button onClick={() => router.back()} className="press">
          <ArrowLeft size={22} />
        </button>
        {otherUser && (
          <Link href={`/profile/${otherUser.id}`} className="flex items-center gap-2 press">
            {otherUser.avatar_url ? (
              <Image src={otherUser.avatar_url} alt="" width={32} height={32} className="rounded-full w-8 h-8 object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-bg-input flex items-center justify-center">
                <User size={14} className="text-text-muted" />
              </div>
            )}
            <span className="font-semibold text-[15px]">{otherUser.full_name || 'Anonymous'}</span>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[14px] ${
                  isMine
                    ? 'bg-accent text-white rounded-br-md'
                    : 'bg-bg-input text-text rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-bg">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-bg-card border border-border rounded-full px-4 py-2.5 text-[14px] placeholder:text-text-muted/50 outline-none focus:border-text-muted transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="bg-accent text-white rounded-full p-2.5 press disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
