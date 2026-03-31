'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Search, User, Users } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const supabaseRef = useRef(createClient())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const performSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      setSearched(false)
      setSearching(false)
      return
    }

    setSearching(true)
    setSearched(true)
    const supabase = supabaseRef.current
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${q}%,username.ilike.%${q}%,major.ilike.%${q}%,clubs.ilike.%${q}%,courses.ilike.%${q}%`)
      .limit(20)

    if (data) setResults(data)
    setSearching(false)
  }, [])

  const handleSearch = (q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 2) {
      setResults([])
      setSearched(false)
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(() => performSearch(q), 300)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-10">
      <h1 className="text-[24px] font-extrabold tracking-tight mb-4">Search</h1>

      <div className="relative mb-5 animate-slide-up">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        <input
          type="text"
          placeholder="Search by name, username, major, clubs..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full bg-bg-card border border-border rounded-full pl-10 pr-4 py-3 text-[14px] placeholder:text-text-muted/50 outline-none focus:border-text-muted transition-colors"
        />
      </div>

      {!searched && !searching && (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-bg-input flex items-center justify-center mb-4">
            <Users size={28} className="text-text-muted/50" />
          </div>
          <p className="text-[15px] font-semibold text-text-muted mb-1">Find people</p>
          <p className="text-[13px] text-text-muted/70 text-center max-w-[240px]">
            Search by name, username, major, clubs, or courses
          </p>
        </div>
      )}

      {searching && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 bg-bg-card border border-border rounded-2xl px-4 py-3.5 animate-pulse">
              <div className="w-11 h-11 rounded-full bg-bg-input shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3.5 bg-bg-input rounded-full w-28" />
                <div className="h-3 bg-bg-input rounded-full w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {searched && !searching && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-bg-input flex items-center justify-center mb-4">
            <Search size={28} className="text-text-muted/50" />
          </div>
          <p className="text-[15px] font-semibold text-text-muted mb-1">No results</p>
          <p className="text-[13px] text-text-muted/70">Try a different search term</p>
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-2 stagger">
          {results.map((profile) => (
            <Link
              key={profile.id}
              href={`/profile/${profile.id}`}
              className="flex items-center gap-3 bg-bg-card border border-border rounded-2xl px-4 py-3.5 hover:bg-bg-card-hover transition-colors press"
            >
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="" width={44} height={44} className="rounded-full w-11 h-11 object-cover shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-bg-input flex items-center justify-center shrink-0">
                  <User size={20} className="text-text-muted" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[14px] truncate">{profile.full_name || 'Anonymous'}</p>
                {profile.username && (
                  <p className="text-[13px] text-text-muted truncate">@{profile.username}</p>
                )}
                {profile.major && (
                  <p className="text-[12px] text-text-muted/70 truncate mt-0.5">{profile.major}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
