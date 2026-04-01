'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Home, Search, Bell, MessageCircle, User } from 'lucide-react'

const navItems = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/notifications', icon: Bell, label: 'Alerts' },
  { href: '/messages', icon: MessageCircle, label: 'DMs' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)
  const supabase = useRef(createClient()).current

  useEffect(() => {
    async function fetchUnread() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
      setUnread(count ?? 0)
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)
    return () => clearInterval(interval)
  }, [supabase])

  useEffect(() => {
    if (pathname.startsWith('/notifications')) {
      setUnread(0)
    }
  }, [pathname])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[2147483647] bg-bg border-t border-border">
      <div className="max-w-md md:max-w-xl mx-auto flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          const showBadge = href === '/notifications' && unread > 0
          return (
            <a
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-2 press ${
                active ? 'text-accent' : 'text-text-muted'
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2 : 1.5} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 bg-accent text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
