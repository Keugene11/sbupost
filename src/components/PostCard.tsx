'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Post } from '@/types'
import { Heart, Trash2, User, MessageCircle, Send, Eye, MoreHorizontal } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'

interface Comment {
  id: string
  user_id: string
  content: string
  created_at: string
  profiles: { id: string; full_name: string; avatar_url: string | null }
}

interface PostCardProps {
  post: Post
  currentUserId: string | null
  onDeleted?: (postId: string) => void
}

export default function PostCard({ post, currentUserId, onDeleted }: PostCardProps) {
  const supabase = useRef(createClient()).current
  const [likes, setLikes] = useState(post.likes?.length ?? 0)
  const [liked, setLiked] = useState(
    post.likes?.some((l) => l.user_id === currentUserId) ?? false
  )
  const [likeAnimating, setLikeAnimating] = useState(false)
  const [showHeartOverlay, setShowHeartOverlay] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [sending, setSending] = useState(false)
  const [impressions, setImpressions] = useState(post.post_impressions?.length ?? 0)
  const cardRef = useRef<HTMLDivElement>(null)
  const impressionRecorded = useRef(false)
  const likeInFlight = useRef(false)
  const lastTapTime = useRef(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const isOwn = currentUserId === post.user_id

  // Impression tracking
  useEffect(() => {
    if (!currentUserId || impressionRecorded.current) return
    const el = cardRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !impressionRecorded.current) {
          impressionRecorded.current = true
          setImpressions((i) => i + 1)
          supabase
            .from('post_impressions')
            .upsert({ post_id: post.id, user_id: currentUserId }, { onConflict: 'post_id,user_id' })
            .then()
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [currentUserId, post.id, supabase])

  // Fetch comment count on mount
  useEffect(() => {
    supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)
      .then(({ count }) => setCommentCount(count ?? 0))
  }, [post.id, supabase])

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  const performLike = useCallback(async () => {
    if (!currentUserId || likeInFlight.current) return
    likeInFlight.current = true

    if (liked) {
      setLiked(false)
      setLikes((l) => l - 1)
      await supabase.from('likes').delete().match({ user_id: currentUserId, post_id: post.id })
    } else {
      setLiked(true)
      setLikes((l) => l + 1)
      setLikeAnimating(true)
      setTimeout(() => setLikeAnimating(false), 450)
      await supabase.from('likes').insert({ user_id: currentUserId, post_id: post.id })
    }

    likeInFlight.current = false
  }, [liked, currentUserId, post.id, supabase])

  // Double-tap to like (Instagram-style)
  const handleDoubleTap = useCallback(() => {
    if (!currentUserId) return
    const now = Date.now()
    if (now - lastTapTime.current < 300) {
      // Double tap detected
      if (!liked) {
        performLike()
      }
      // Show heart overlay regardless
      setShowHeartOverlay(true)
      setTimeout(() => setShowHeartOverlay(false), 800)
      lastTapTime.current = 0
    } else {
      lastTapTime.current = now
    }
  }, [currentUserId, liked, performLike])

  const handleDelete = async () => {
    setShowMenu(false)
    if (!confirm('Delete this post?')) return
    setDeleting(true)
    await supabase.from('posts').delete().eq('id', post.id)
    onDeleted?.(post.id)
  }

  const fetchComments = async () => {
    setLoadingComments(true)
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(id, full_name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    if (data) {
      setComments(data as unknown as Comment[])
      setCommentCount(data.length)
    }
    setLoadingComments(false)
  }

  const toggleComments = async () => {
    if (!showComments) {
      await fetchComments()
    }
    setShowComments(!showComments)
  }

  const handleComment = async () => {
    if (!newComment.trim() || !currentUserId) return
    setSending(true)
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: post.id, user_id: currentUserId, content: newComment.trim() })
      .select('*, profiles(id, full_name, avatar_url)')
      .single()
    if (data) {
      setComments((prev) => [...prev, data as unknown as Comment])
      setCommentCount((c) => c + 1)
    }
    setNewComment('')
    setSending(false)
  }

  const deleteComment = async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    setCommentCount((c) => c - 1)
  }

  const profile = post.profiles
  const mediaList = post.media_urls?.length > 0 ? post.media_urls : post.image_url ? [post.image_url] : []

  return (
    <div
      ref={cardRef}
      className={`bg-bg-card border border-border rounded-2xl transition-opacity duration-200 ${deleting ? 'opacity-40 pointer-events-none' : ''}`}
    >
      <div className="flex items-start gap-3 px-4 pt-4">
        {/* Avatar */}
        <Link href={`/profile/${post.user_id}`} className="shrink-0">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name}
              width={40}
              height={40}
              className="rounded-full object-cover w-10 h-10"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-bg-input flex items-center justify-center">
              <User size={18} className="text-text-muted" />
            </div>
          )}
        </Link>

        {/* Header */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <Link
                href={`/profile/${post.user_id}`}
                className="font-semibold text-[14px] text-text hover:underline truncate"
              >
                {profile?.full_name || 'Anonymous'}
              </Link>
              <span className="text-[12px] text-text-muted shrink-0">
                · {formatDistanceToNow(new Date(post.created_at), { addSuffix: false })}
              </span>
            </div>

            {/* More menu */}
            {isOwn && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-text-muted hover:text-text p-1 -m-1 press transition-colors"
                >
                  <MoreHorizontal size={18} strokeWidth={1.5} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 z-20 bg-bg-card border border-border rounded-xl shadow-lg py-1 min-w-[140px] animate-scale-in">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-red-500 font-medium hover:bg-red-50 transition-colors"
                    >
                      Delete post
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content area - double tap target */}
      <div className="px-4 pb-1" onClick={handleDoubleTap}>
        {post.content && (
          <p className="text-[15px] leading-relaxed mt-1 ml-[52px] whitespace-pre-wrap break-words">
            {post.content}
          </p>
        )}

        {/* Media */}
        {mediaList.length > 0 && (
          <div className={`relative grid gap-1 mt-3 ml-[52px] rounded-xl overflow-hidden ${mediaList.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {mediaList.map((url, i) =>
              url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') ? (
                <video
                  key={i}
                  src={url}
                  controls
                  className="w-full max-h-[300px] object-cover"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <Image
                  key={i}
                  src={url}
                  alt="Post media"
                  width={500}
                  height={400}
                  className="w-full max-h-[300px] object-cover"
                />
              )
            )}

            {/* Double-tap heart overlay */}
            {showHeartOverlay && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <Heart
                  size={72}
                  className="text-white drop-shadow-lg like-pop"
                  fill="white"
                  strokeWidth={0}
                />
              </div>
            )}
          </div>
        )}

        {/* Heart overlay for text-only posts */}
        {showHeartOverlay && mediaList.length === 0 && (
          <div className="flex justify-center py-2 pointer-events-none">
            <Heart
              size={48}
              className="text-accent like-pop"
              fill="currentColor"
              strokeWidth={0}
            />
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-1 px-4 py-2.5 ml-[40px]">
        <button
          onClick={performLike}
          className={`flex items-center gap-1.5 text-[13px] press rounded-full px-2.5 py-1.5 -ml-2.5 transition-colors ${
            liked ? 'text-red-500' : 'text-text-muted hover:text-red-400'
          }`}
        >
          <Heart
            size={17}
            fill={liked ? 'currentColor' : 'none'}
            strokeWidth={1.5}
            className={likeAnimating ? 'like-pop' : ''}
          />
          {likes > 0 && <span className="font-medium">{likes}</span>}
        </button>

        <button
          onClick={toggleComments}
          className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-blue-500 press rounded-full px-2.5 py-1.5 transition-colors"
        >
          <MessageCircle size={17} strokeWidth={1.5} />
          {commentCount > 0 && <span className="font-medium">{commentCount}</span>}
        </button>

        <span className="flex items-center gap-1.5 text-[13px] text-text-muted rounded-full px-2.5 py-1.5">
          <Eye size={17} strokeWidth={1.5} />
          {impressions > 0 && <span className="font-medium">{impressions}</span>}
        </span>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-border mx-4 pt-3 pb-4 animate-fade-in">
          {loadingComments ? (
            <div className="space-y-3 py-2">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-7 h-7 skeleton skeleton-avatar shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton skeleton-text w-24" />
                    <div className="skeleton skeleton-text w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-[13px] text-text-muted/60 text-center py-3">No comments yet</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <Link href={`/profile/${c.user_id}`} className="shrink-0">
                    {c.profiles?.avatar_url ? (
                      <Image
                        src={c.profiles.avatar_url}
                        alt=""
                        width={28}
                        height={28}
                        className="rounded-full w-7 h-7 object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-bg-input flex items-center justify-center">
                        <User size={11} className="text-text-muted" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="bg-bg-input rounded-2xl px-3 py-2">
                      <Link
                        href={`/profile/${c.user_id}`}
                        className="font-semibold text-[13px] hover:underline"
                      >
                        {c.profiles?.full_name || 'Anonymous'}
                      </Link>
                      <p className="text-[13px] leading-snug mt-0.5">{c.content}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 ml-2">
                      <span className="text-[11px] text-text-muted">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: false })}
                      </span>
                      {c.user_id === currentUserId && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="text-[11px] text-text-muted hover:text-red-500 press font-medium transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          <div className="flex items-center gap-2 mt-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => { if (e.target.value.length <= 5000) setNewComment(e.target.value) }}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
              placeholder="Add a comment..."
              maxLength={5000}
              className="flex-1 bg-bg-input border border-border rounded-full px-4 py-2 text-[13px] placeholder:text-text-muted/50 outline-none focus:border-text-muted transition-colors"
            />
            <button
              onClick={handleComment}
              disabled={!newComment.trim() || sending}
              className="text-accent press disabled:opacity-30 p-1.5 transition-opacity"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={17} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
