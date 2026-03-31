'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/types'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'

interface OtherUser {
  id: string
  full_name: string
  avatar_url: string | null
}

function ChatSkeleton() {
  return (
    <div className="max-w-md mx-auto flex flex-col h-[100dvh]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-bg">
        <div className="w-5 h-5 rounded bg-bg-input animate-pulse" />
        <div className="w-8 h-8 rounded-full bg-bg-input animate-pulse" />
        <div className="h-4 w-24 bg-bg-input rounded-full animate-pulse" />
      </div>
      <div className="flex-1 px-4 py-4 space-y-3">
        <div className="flex justify-start">
          <div className="h-10 w-48 bg-bg-input rounded-2xl rounded-bl-md animate-pulse" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-36 bg-bg-input rounded-2xl rounded-br-md animate-pulse" />
        </div>
        <div className="flex justify-start">
          <div className="h-10 w-56 bg-bg-input rounded-2xl rounded-bl-md animate-pulse" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-44 bg-bg-input rounded-2xl rounded-br-md animate-pulse" />
        </div>
      </div>
    </div>
  )
}

function formatDateSeparator(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d, yyyy')
}

function shouldShowTime(current: Message, previous: Message | undefined): boolean {
  if (!previous) return true
  const diff = new Date(current.created_at).getTime() - new Date(previous.created_at).getTime()
  // Show time if more than 5 minutes apart or different sender
  return diff > 5 * 60 * 1000 || current.sender_id !== previous.sender_id
}

function shouldShowDateSeparator(current: Message, previous: Message | undefined): boolean {
  if (!previous) return true
  return !isSameDay(new Date(current.created_at), new Date(previous.created_at))
}

export default function ChatPage() {
  const { id: conversationId } = useParams<{ id: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = useRef(createClient()).current
  const router = useRouter()

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  const fetchMessages = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    // Fetch conversation details and messages in parallel
    const [convoResult, msgsResult] = await Promise.all([
      supabase
        .from('conversations')
        .select(`
          user1_id, user2_id,
          user1:profiles!conversations_user1_id_fkey(id, full_name, avatar_url),
          user2:profiles!conversations_user2_id_fkey(id, full_name, avatar_url)
        `)
        .eq('id', conversationId)
        .single(),
      supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true }),
    ])

    if (convoResult.data) {
      const other = convoResult.data.user1_id === user.id
        ? convoResult.data.user2
        : convoResult.data.user1
      setOtherUser(other as unknown as OtherUser)
    }

    if (msgsResult.data) setMessages(msgsResult.data)
    setLoading(false)

    // Scroll to bottom instantly on first load
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
    })
  }, [supabase, conversationId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

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
    if (!newMessage.trim() || !currentUserId || sending) return
    setSending(true)

    const messageContent = newMessage.trim()
    const tempId = crypto.randomUUID()
    setNewMessage('')

    // Optimistic update
    const tempMsg: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: messageContent,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: messageContent,
      })

      if (error) throw error

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId)
    } catch {
      // Rollback optimistic update on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setNewMessage(messageContent) // Restore the message to the input
      setFailedIds((prev) => new Set(prev).add(tempId))
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Group messages for rendering
  const renderedMessages = useMemo(() => {
    return messages.map((msg, i) => {
      const prev = i > 0 ? messages[i - 1] : undefined
      const next = i < messages.length - 1 ? messages[i + 1] : undefined
      const isMine = msg.sender_id === currentUserId
      const showDate = shouldShowDateSeparator(msg, prev)
      const showTime = shouldShowTime(msg, prev)
      const isLastInGroup = !next || next.sender_id !== msg.sender_id || shouldShowTime(next, msg)
      const isFirstInGroup = showTime

      return { msg, isMine, showDate, showTime, isFirstInGroup, isLastInGroup }
    })
  }, [messages, currentUserId])

  if (loading) return <ChatSkeleton />

  return (
    <div className="max-w-md mx-auto flex flex-col h-[100dvh]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-bg/95 backdrop-blur-md sticky top-0 z-10">
        <button onClick={() => router.back()} className="press p-1 -ml-1">
          <ArrowLeft size={22} />
        </button>
        {otherUser && (
          <Link href={`/profile/${otherUser.id}`} className="flex items-center gap-2.5 press flex-1 min-w-0">
            {otherUser.avatar_url ? (
              <Image
                src={otherUser.avatar_url}
                alt=""
                width={36}
                height={36}
                className="rounded-full w-9 h-9 object-cover shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-bg-input flex items-center justify-center shrink-0">
                <User size={16} className="text-text-muted" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-[15px] truncate leading-tight">
                {otherUser.full_name || 'Anonymous'}
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-3">
        {renderedMessages.map(({ msg, isMine, showDate, showTime, isFirstInGroup, isLastInGroup }) => (
          <div key={msg.id}>
            {/* Date separator */}
            {showDate && (
              <div className="flex justify-center my-4">
                <span className="text-[11px] text-text-muted font-medium bg-bg-input/70 px-3 py-1 rounded-full">
                  {formatDateSeparator(new Date(msg.created_at))}
                </span>
              </div>
            )}

            {/* Time label for message group */}
            {showTime && !showDate && (
              <div className="flex justify-center my-3">
                <span className="text-[11px] text-text-muted">
                  {format(new Date(msg.created_at), 'h:mm a')}
                </span>
              </div>
            )}

            {/* Show time alongside date if it's a date separator */}
            {showDate && (
              <div className="flex justify-center mb-3 -mt-2">
                <span className="text-[11px] text-text-muted">
                  {format(new Date(msg.created_at), 'h:mm a')}
                </span>
              </div>
            )}

            {/* Message bubble */}
            <div
              className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${
                isFirstInGroup && !showTime && !showDate ? 'mt-1.5' : 'mt-0.5'
              }`}
            >
              <div
                className={`max-w-[75%] px-3.5 py-2 text-[15px] leading-relaxed ${
                  isMine
                    ? `bg-accent text-white ${
                        isFirstInGroup && isLastInGroup
                          ? 'rounded-2xl rounded-br-md'
                          : isFirstInGroup
                          ? 'rounded-2xl rounded-br-md'
                          : isLastInGroup
                          ? 'rounded-2xl rounded-tr-md'
                          : 'rounded-2xl rounded-r-md'
                      }`
                    : `bg-bg-input text-text ${
                        isFirstInGroup && isLastInGroup
                          ? 'rounded-2xl rounded-bl-md'
                          : isFirstInGroup
                          ? 'rounded-2xl rounded-bl-md'
                          : isLastInGroup
                          ? 'rounded-2xl rounded-tl-md'
                          : 'rounded-2xl rounded-l-md'
                      }`
                } ${failedIds.has(msg.id) ? 'opacity-50' : ''}`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-2.5 border-t border-border bg-bg/95 backdrop-blur-md pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-bg-card border border-border rounded-full px-4 py-2.5 text-[15px] placeholder:text-text-muted/50 outline-none focus:border-text-muted transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className={`rounded-full p-2.5 press transition-all ${
              newMessage.trim()
                ? 'bg-accent text-white scale-100'
                : 'bg-bg-input text-text-muted scale-95 opacity-60'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
