'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Post } from '@/types'
import PostCard from '@/components/PostCard'
import CreatePost from '@/components/CreatePost'

function SkeletonCard() {
  return (
    <div className="bg-bg-card border border-border rounded-2xl px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 skeleton skeleton-avatar shrink-0" />
        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="skeleton skeleton-text w-28" />
            <div className="skeleton skeleton-text w-16" />
          </div>
          <div className="skeleton skeleton-text w-full" />
          <div className="skeleton skeleton-text w-3/4" />
          <div className="flex items-center gap-4 mt-3">
            <div className="skeleton skeleton-text w-10" />
            <div className="skeleton skeleton-text w-10" />
            <div className="skeleton skeleton-text w-10" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = useRef(createClient()).current

  // Pull-to-refresh state
  const scrollRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const pullThreshold = 80

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles!posts_user_id_fkey(*), likes(user_id), post_impressions(post_id)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) setPosts(data as Post[])
    setLoading(false)
    setRefreshing(false)
  }, [supabase])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
    fetchPosts()
  }, [fetchPosts, supabase.auth])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchPosts()
  }, [fetchPosts])

  // Pull-to-refresh touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollTop = scrollRef.current?.scrollTop ?? window.scrollY
    if (scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return
    const diff = e.touches[0].clientY - touchStartY.current
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 120))
    }
  }, [isPulling])

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= pullThreshold && !refreshing) {
      handleRefresh()
    }
    setPullDistance(0)
    setIsPulling(false)
  }, [pullDistance, pullThreshold, refreshing, handleRefresh])

  const handlePostCreated = () => {
    fetchPosts()
  }

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  return (
    <div
      ref={scrollRef}
      className="max-w-md mx-auto px-4 pt-4 pb-nav"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="flex justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance > 0 ? pullDistance : 0, opacity: pullDistance / pullThreshold }}
      >
        <div
          className="flex items-center justify-center"
          style={{ transform: `rotate(${(pullDistance / pullThreshold) * 360}deg)` }}
        >
          <div className="w-5 h-5 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
        </div>
      </div>

      {/* Refreshing bar */}
      {refreshing && (
        <div className="flex justify-center py-2 mb-2 animate-fade-in">
          <div className="w-5 h-5 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Header */}
      <div className="mb-5 pt-2">
        <h1 className="text-[26px] font-extrabold tracking-tight text-text">SBUPost</h1>
      </div>

      <CreatePost onPostCreated={handlePostCreated} />

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <p className="text-text-muted text-[15px] font-medium">No posts yet</p>
          <p className="text-text-muted/60 text-[13px] mt-1">Be the first to share something</p>
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
