'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Search, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [searched, setSearched] = useState(false)
  const supabase = createClient()

  const handleSearch = async (q: string) => {
    setQuery(q)
    if (q.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }

    setSearched(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${q}%,major.ilike.%${q}%,clubs.ilike.%${q}%,courses.ilike.%${q}%`)
      .limit(20)

    if (data) setResults(data)
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <h1 className="text-[24px] font-extrabold tracking-tight mb-4">Search</h1>

      <div className="relative mb-4 animate-slide-up">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        <input
          type="text"
          placeholder="Search by name, major, clubs, courses..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full bg-bg-card border border-border rounded-full pl-10 pr-4 py-2.5 text-[14px] placeholder:text-text-muted/50 outline-none focus:border-text-muted transition-colors"
        />
      </div>

      {searched && results.length === 0 && (
        <p className="text-center text-text-muted text-[14px] py-8">No results found</p>
      )}

      <div className="space-y-2 stagger">
        {results.map((profile) => (
          <Link
            key={profile.id}
            href={`/profile/${profile.id}`}
            className="flex items-center gap-3 bg-bg-card border border-border rounded-2xl px-4 py-3 hover:bg-bg-card-hover transition-colors press"
          >
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="" width={40} height={40} className="rounded-full w-10 h-10 object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-bg-input flex items-center justify-center shrink-0">
                <User size={18} className="text-text-muted" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-[14px] truncate">{profile.full_name || 'Anonymous'}</p>
              {profile.major && (
                <p className="text-[12px] text-text-muted truncate">{profile.major}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
