'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart, UserPlus, MessageCircle, Loader2, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useRef(createClient()).current

  useEffect(() => {
    async function fetch() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from('notifications')
          .select('*, actor:profiles!notifications_actor_id_fkey(id, full_name, avatar_url)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (data) setNotifications(data as unknown as Notification[])

        // Mark all as read
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false)
      } catch {
        // Notifications load failed - will show empty
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    )
  }

  return (
    <div className="max-w-md md:max-w-xl mx-auto px-4 pt-6">
      <h1 className="text-[24px] font-extrabold tracking-tight mb-4">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="text-center text-text-muted text-[14px] py-12">No notifications yet</p>
      ) : (
        <div className="space-y-2 stagger">
          {notifications.map((notif) => (
            <Link
              key={notif.id}
              href={notif.type === 'like' && notif.post_id ? `/feed` : `/profile/${notif.actor_id}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors press ${
                notif.read
                  ? 'bg-bg-card border-border'
                  : 'bg-accent/5 border-accent/20'
              }`}
            >
              {notif.actor?.avatar_url ? (
                <Image src={notif.actor.avatar_url} alt="" width={40} height={40} className="rounded-full w-10 h-10 object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-bg-input flex items-center justify-center shrink-0">
                  <User size={18} className="text-text-muted" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[14px]">
                  <span className="font-semibold">{notif.actor?.full_name || 'Someone'}</span>
                  {notif.type === 'like' && ' liked your post'}
                  {notif.type === 'comment' && ' commented on your post'}
                  {notif.type === 'follow' && ' started following you'}
                </p>
                <p className="text-[12px] text-text-muted">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="shrink-0">
                {notif.type === 'like' && <Heart size={18} className="text-accent" fill="currentColor" />}
                {notif.type === 'comment' && <MessageCircle size={18} className="text-green-500" />}
                {notif.type === 'follow' && <UserPlus size={18} className="text-blue-500" />}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
