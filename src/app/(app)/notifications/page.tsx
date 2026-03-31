'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart, UserPlus, MessageCircle, Bell, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow, isToday, isThisWeek } from 'date-fns'

interface Notification {
  id: string
  user_id: string
  actor_id: string
  type: 'like' | 'follow' | 'comment'
  post_id: string | null
  read: boolean
  created_at: string
  actor: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

function NotificationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-11 h-11 rounded-full bg-bg-input animate-pulse shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 w-48 bg-bg-input rounded-full animate-pulse" />
        <div className="h-3 w-20 bg-bg-input rounded-full animate-pulse" />
      </div>
      <div className="w-8 h-8 rounded-full bg-bg-input animate-pulse shrink-0" />
    </div>
  )
}

function getNotificationHref(notif: Notification): string {
  if (notif.type === 'follow') return `/profile/${notif.actor_id}`
  if (notif.post_id) return `/feed`
  return `/profile/${notif.actor_id}`
}

function getNotificationText(type: string): string {
  switch (type) {
    case 'like': return ' liked your post'
    case 'comment': return ' commented on your post'
    case 'follow': return ' started following you'
    default: return ''
  }
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'like':
      return (
        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <Heart size={15} className="text-red-500" fill="currentColor" />
        </div>
      )
    case 'comment':
      return (
        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
          <MessageCircle size={15} className="text-green-500" />
        </div>
      )
    case 'follow':
      return (
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
          <UserPlus size={15} className="text-blue-500" />
        </div>
      )
    default:
      return null
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useRef(createClient()).current

  useEffect(() => {
    async function fetchNotifications() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notifications')
        .select('*, actor:profiles!notifications_actor_id_fkey(id, full_name, avatar_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) setNotifications(data as unknown as Notification[])
      setLoading(false)

      // Mark all as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)
    }
    fetchNotifications()
  }, [supabase])

  // Group notifications by time period
  const grouped = useMemo(() => {
    const today: Notification[] = []
    const thisWeek: Notification[] = []
    const earlier: Notification[] = []

    for (const notif of notifications) {
      const date = new Date(notif.created_at)
      if (isToday(date)) {
        today.push(notif)
      } else if (isThisWeek(date)) {
        thisWeek.push(notif)
      } else {
        earlier.push(notif)
      }
    }

    return { today, thisWeek, earlier }
  }, [notifications])

  const renderNotification = (notif: Notification) => (
    <Link
      key={notif.id}
      href={getNotificationHref(notif)}
      className={`flex items-center gap-3 px-4 py-3 -mx-4 transition-colors press active:bg-bg-card-hover ${
        !notif.read ? 'bg-accent/[0.03]' : 'hover:bg-bg-card-hover'
      }`}
    >
      <div className="relative shrink-0">
        {notif.actor?.avatar_url ? (
          <Image
            src={notif.actor.avatar_url}
            alt=""
            width={44}
            height={44}
            className="rounded-full w-11 h-11 object-cover"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-bg-input flex items-center justify-center">
            <User size={18} className="text-text-muted" />
          </div>
        )}
        {!notif.read && (
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-bg" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] leading-snug">
          <span className="font-semibold">{notif.actor?.full_name || 'Someone'}</span>
          <span className="text-text-muted">{getNotificationText(notif.type)}</span>
        </p>
        <p className="text-[12px] text-text-muted mt-0.5">
          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
        </p>
      </div>
      {getNotificationIcon(notif.type)}
    </Link>
  )

  const renderSection = (title: string, items: Notification[]) => {
    if (items.length === 0) return null
    return (
      <div className="mb-2">
        <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wider px-0 py-2">
          {title}
        </p>
        <div>{items.map(renderNotification)}</div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4">
      <h1 className="text-[28px] font-extrabold tracking-tight mb-1">Notifications</h1>
      <p className="text-[13px] text-text-muted mb-5">Stay up to date</p>

      {loading ? (
        <div className="divide-y divide-border/50">
          {Array.from({ length: 8 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-bg-input flex items-center justify-center mb-4">
            <Bell size={28} className="text-text-muted" />
          </div>
          <p className="text-[16px] font-semibold text-text mb-1">No notifications yet</p>
          <p className="text-[13px] text-text-muted text-center max-w-[240px]">
            When someone interacts with your posts, you&apos;ll see it here
          </p>
        </div>
      ) : (
        <div className="animate-fade-in">
          {renderSection('Today', grouped.today)}
          {renderSection('This Week', grouped.thisWeek)}
          {renderSection('Earlier', grouped.earlier)}
        </div>
      )}
    </div>
  )
}
