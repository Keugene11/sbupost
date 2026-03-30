'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { X, User, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface FollowListModalProps {
  userId: string
  type: 'followers' | 'following'
  onClose: () => void
}

export default function FollowListModal({ userId, type, onClose }: FollowListModalProps) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useRef(createClient()).current

  useEffect(() => {
    async function fetch() {
      if (type === 'followers') {
        const { data } = await supabase
          .from('follows')
          .select('follower_id, profiles:profiles!follows_follower_id_fkey(*)')
          .eq('following_id', userId)
        if (data) {
          setProfiles(data.map((d) => d.profiles as unknown as Profile))
        }
      } else {
        const { data } = await supabase
          .from('follows')
          .select('following_id, profiles:profiles!follows_following_id_fkey(*)')
          .eq('follower_id', userId)
        if (data) {
          setProfiles(data.map((d) => d.profiles as unknown as Profile))
        }
      }
      setLoading(false)
    }
    fetch()
  }, [supabase, userId, type])

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 2147483646 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-bg border border-border rounded-2xl px-5 py-5 w-full max-w-sm mx-4 relative max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-bold capitalize">{type}</h2>
          <button onClick={onClose} className="press">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-text-muted" />
          </div>
        ) : profiles.length === 0 ? (
          <p className="text-[14px] text-text-muted text-center py-8">
            {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          </p>
        ) : (
          <div className="overflow-y-auto space-y-2">
            {profiles.map((p) => (
              <a
                key={p.id}
                href={`/profile/${p.id}`}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-bg-card-hover transition-colors press"
              >
                {p.avatar_url ? (
                  <Image src={p.avatar_url} alt="" width={36} height={36} className="rounded-full w-9 h-9 object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-bg-input flex items-center justify-center shrink-0">
                    <User size={16} className="text-text-muted" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-[14px] truncate">{p.full_name || 'Anonymous'}</p>
                  {p.major && <p className="text-[12px] text-text-muted truncate">{p.major}</p>}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
