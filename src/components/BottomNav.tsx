'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Home, Search, Bell, MessageCircle, User } from 'lucide-react'

const navItems = [
  { href: '/feed', icon: Home },
  { href: '/search', icon: Search },
  { href: '/notifications', icon: Bell },
  { href: '/messages', icon: MessageCircle },
  { href: '/profile', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)
  const supabase = useRef(createClient()).current

  const fetchUnread = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
    setUnread(count ?? 0)
  }, [supabase])

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  // Clear badge when on notifications page
  useEffect(() => {
    if (pathname.startsWith('/notifications')) {
      setUnread(0)
    }
  }, [pathname])

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 2147483647,
      }}
      className="bg-bg/80 backdrop-blur-xl backdrop-saturate-150 border-t border-border/50"
    >
      <div className="max-w-md mx-auto flex items-center justify-around py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map(({ href, icon: Icon }) => {
          const active = pathname.startsWith(href)
          const showBadge = href === '/notifications' && unread > 0
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className="relative flex flex-col items-center justify-center w-12 h-10 press"
            >
              <div className="relative">
                <Icon
                  size={24}
                  strokeWidth={active ? 2.2 : 1.5}
                  className={`transition-colors duration-200 ${
                    active ? 'text-text' : 'text-text-muted/60'
                  }`}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 bg-accent text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 badge-pulse">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              {/* Active indicator dot */}
              <div
                className={`w-1 h-1 rounded-full mt-1 transition-all duration-200 ${
                  active ? 'bg-text scale-100 opacity-100' : 'bg-transparent scale-0 opacity-0'
                }`}
              />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
