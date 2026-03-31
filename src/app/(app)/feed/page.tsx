'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Post } from '@/types'
import PostCard from '@/components/PostCard'
import CreatePost from '@/components/CreatePost'
import { Loader2 } from 'lucide-react'

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = useRef(createClient()).current

  const fetchPosts = useCallback(async () => {
    // Get blocked users list to filter them out
    const { data: { user } } = await supabase.auth.getUser()
    let blockedIds: string[] = []
    if (user) {
      const { data: blocked } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id)
      if (blocked) blockedIds = blocked.map((b) => b.blocked_id)
    }

    let query = supabase
      .from('posts')
      .select('*, profiles!posts_user_id_fkey(*), likes(user_id), post_impressions(post_id)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (blockedIds.length > 0) {
      // Filter out posts from blocked users
      query = query.not('user_id', 'in', `(${blockedIds.join(',')})`)
    }

    const { data } = await query

    if (data) setPosts(data as Post[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
    fetchPosts()
  }, [fetchPosts, supabase.auth])

  const handlePostCreated = () => {
    fetchPosts()
  }

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <div className="mb-4">
        <h1 className="text-[28px] font-extrabold tracking-tight text-text">SBUPost</h1>
        <p className="text-[13px] text-text-muted">The social network for Stony Brook students</p>
      </div>
      <CreatePost onPostCreated={handlePostCreated} />
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-text-muted" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-[14px]">
          No posts yet. Be the first to post!
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={userId}
              onDeleted={handlePostDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
