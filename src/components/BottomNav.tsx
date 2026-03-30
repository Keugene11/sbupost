'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, MessageCircle, User } from 'lucide-react'

const navItems = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 2147483647,
        backgroundColor: 'var(--color-bg, #fafafa)',
        borderTop: '1px solid var(--color-border, #e8e8e8)',
      }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 press ${
                active ? 'text-accent' : 'text-text-muted'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2 : 1.5} style={{ pointerEvents: 'none' }} />
              <span className="text-[10px] font-medium" style={{ pointerEvents: 'none' }}>{label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
