'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Post } from '@/types'
import PostCard from '@/components/PostCard'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = useRef(createClient()).current
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const fetchPost = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    const { data } = await supabase
      .from('posts')
      .select('*, profiles!posts_user_id_fkey(*), likes(user_id), post_impressions(user_id)')
      .eq('id', id)
      .single()

    if (data) {
      const ADMIN_EMAILS = ['keugenelee11@gmail.com']
      const isAdmin = ADMIN_EMAILS.includes(user?.email || '')
      // Block unapproved posts unless author or admin
      if (!data.is_approved && data.user_id !== user?.id && !isAdmin) {
        router.push('/feed')
        return
      }
      setPost(data as Post)
    }
    setLoading(false)
  }, [id, supabase, router])

  useEffect(() => {
    fetchPost()
  }, [fetchPost])

  const handleDeleted = () => {
    router.push('/feed')
  }

  return (
    <div className="max-w-md md:max-w-xl mx-auto px-4 pt-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[14px] text-text-muted mb-4 press"
      >
        <ArrowLeft size={18} />
        Back
      </button>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-text-muted" />
        </div>
      ) : !post ? (
        <div className="text-center py-12 text-text-muted text-[14px]">
          Post not found or has been deleted.
        </div>
      ) : (
        <PostCard
          post={post}
          currentUserId={userId}
          onDeleted={handleDeleted}
          defaultShowComments
        />
      )}
    </div>
  )
}
