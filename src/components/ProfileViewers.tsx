'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, User } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Viewer {
  viewer_id: string
  viewed_at: string
  viewer: {
    id: string
    full_name: string
    avatar_url: string | null
    major: string
  }
}

export default function ProfileViewers({ userId }: { userId: string }) {
  const [viewers, setViewers] = useState<Viewer[]>([])
  const [expanded, setExpanded] = useState(false)
  const supabase = useRef(createClient()).current

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('profile_views')
        .select('viewer_id, viewed_at, viewer:profiles!profile_views_viewer_id_fkey(id, full_name, avatar_url, major)')
        .eq('profile_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(20)
      if (data) setViewers(data as unknown as Viewer[])
    }
    fetch()
  }, [supabase, userId])

  return (
    <div className="bg-bg-card border border-border rounded-2xl px-5 py-4 mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full press"
      >
        <div className="flex items-center gap-2">
          <Eye size={18} className="text-text-muted" />
          <span className="font-semibold text-[14px]">Profile viewers</span>
          <span className="text-[13px] text-text-muted">{viewers.length}</span>
        </div>
        <span className="text-[12px] text-accent font-medium">
          {expanded ? 'Hide' : 'View all'}
        </span>
      </button>

      {!expanded && viewers.length === 0 && (
        <p className="text-[13px] text-text-muted mt-2">No one has viewed your profile yet</p>
      )}

      {!expanded && viewers.length > 0 && (
        <div className="flex items-center mt-3 -space-x-2">
          {viewers.slice(0, 5).map((v) => (
            v.viewer?.avatar_url ? (
              <Image key={v.viewer_id} src={v.viewer.avatar_url} alt="" width={28} height={28} className="rounded-full w-7 h-7 object-cover border-2 border-bg-card" />
            ) : (
              <div key={v.viewer_id} className="w-7 h-7 rounded-full bg-bg-input flex items-center justify-center border-2 border-bg-card">
                <User size={12} className="text-text-muted" />
              </div>
            )
          ))}
          {viewers.length > 5 && (
            <div className="w-7 h-7 rounded-full bg-bg-input flex items-center justify-center border-2 border-bg-card text-[10px] font-semibold text-text-muted">
              +{viewers.length - 5}
            </div>
          )}
        </div>
      )}

      {expanded && (
        <div className="space-y-2 mt-3">
          {viewers.map((v) => (
            <Link
              key={v.viewer_id}
              href={`/profile/${v.viewer_id}`}
              className="flex items-center gap-3 py-1.5 press"
            >
              {v.viewer?.avatar_url ? (
                <Image src={v.viewer.avatar_url} alt="" width={32} height={32} className="rounded-full w-8 h-8 object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-bg-input flex items-center justify-center shrink-0">
                  <User size={14} className="text-text-muted" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] truncate">{v.viewer?.full_name || 'Anonymous'}</p>
                {v.viewer?.major && <p className="text-[11px] text-text-muted truncate">{v.viewer.major}</p>}
              </div>
              <span className="text-[11px] text-text-muted shrink-0">
                {formatDistanceToNow(new Date(v.viewed_at), { addSuffix: true })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
