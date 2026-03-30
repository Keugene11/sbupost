'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Post } from '@/types'
import PostCard from '@/components/PostCard'
import CreatePost from '@/components/CreatePost'
import { Loader2 } from 'lucide-react'

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(*), likes(user_id)')
      .order('created_at', { ascending: false })
      .limit(50)

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
      <h1 className="text-[28px] font-extrabold tracking-tight text-text mb-4">Feed</h1>
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
