'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Post } from '@/types'
import { Heart, Trash2, User, MessageCircle, Send, Eye, Flag } from 'lucide-react'
import ReportModal from '@/components/ReportModal'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  defaultShowComments?: boolean
}

export default function PostCard({ post, currentUserId, onDeleted, defaultShowComments = false }: PostCardProps) {
  const supabase = useRef(createClient()).current
  const router = useRouter()
  const [likes, setLikes] = useState(post.likes?.length ?? 0)
  const [liked, setLiked] = useState(
    post.likes?.some((l) => l.user_id === currentUserId) ?? false
  )
  const [deleting, setDeleting] = useState(false)
  const [showComments, setShowComments] = useState(defaultShowComments)
  const [comments, setComments] = useState<Comment[]>([])
  const [previewComments, setPreviewComments] = useState<Comment[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [sending, setSending] = useState(false)
  const [impressions, setImpressions] = useState(post.post_impressions?.length ?? 0)
  const [showReport, setShowReport] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const impressionRecorded = useRef(false)
  const isOwn = currentUserId === post.user_id

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

  // Fetch comment count + preview comments on mount
  useEffect(() => {
    const fetchPreview = async () => {
      const [{ count }, { data: preview }] = await Promise.all([
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id),
        supabase
          .from('comments')
          .select('*, profiles(id, full_name, avatar_url)')
          .eq('post_id', post.id)
          .order('created_at', { ascending: false })
          .limit(2),
      ])
      setCommentCount(count ?? 0)
      if (preview) setPreviewComments((preview as unknown as Comment[]).reverse())
    }
    fetchPreview()

    if (defaultShowComments) {
      fetchAllComments()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id, supabase])

  const fetchAllComments = async () => {
    setLoadingComments(true)
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(id, full_name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    if (data) setComments(data as unknown as Comment[])
    setLoadingComments(false)
  }

  const toggleLike = async () => {
    if (!currentUserId) return
    if (liked) {
      setLiked(false)
      setLikes((l) => l - 1)
      await supabase.from('likes').delete().match({ user_id: currentUserId, post_id: post.id })
    } else {
      setLiked(true)
      setLikes((l) => l + 1)
      await supabase.from('likes').insert({ user_id: currentUserId, post_id: post.id })
    }
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = async () => {
    setShowDeleteConfirm(false)
    setDeleting(true)
    await supabase.from('posts').delete().eq('id', post.id)
    onDeleted?.(post.id)
  }

  const toggleComments = async () => {
    if (!showComments) {
      await fetchAllComments()
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
      const comment = data as unknown as Comment
      setComments((prev) => [...prev, comment])
      setPreviewComments((prev) => [...prev.slice(-1), comment])
      setCommentCount((c) => c + 1)
    }
    setNewComment('')
    setSending(false)
  }

  const deleteComment = async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    setPreviewComments((prev) => prev.filter((c) => c.id !== commentId))
    setCommentCount((c) => c - 1)
  }

  const navigateToPost = () => {
    if (!defaultShowComments) {
      router.push(`/post/${post.id}`)
    }
  }

  const profile = post.profiles

  const renderComment = (c: Comment, compact = false) => (
    <div key={c.id} className="flex items-start gap-2">
      <Link href={`/profile/${c.user_id}`} className="shrink-0">
        {c.profiles?.avatar_url ? (
          <Image src={c.profiles.avatar_url} alt="" width={compact ? 20 : 24} height={compact ? 20 : 24} className={`rounded-full ${compact ? 'w-5 h-5' : 'w-6 h-6'} object-cover`} />
        ) : (
          <div className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} rounded-full bg-bg-input flex items-center justify-center`}>
            <User size={compact ? 8 : 10} className="text-text-muted" />
          </div>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <p className={`${compact ? 'text-[12px]' : 'text-[13px]'}`}>
          <Link href={`/profile/${c.user_id}`} className="font-semibold hover:underline">
            {c.profiles?.full_name || 'Anonymous'}
          </Link>{' '}
          <span className={compact ? 'text-text/80' : ''}>{c.content}</span>
        </p>
        {!compact && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-muted">
              {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
            </span>
            {c.user_id === currentUserId && (
              <button onClick={() => deleteComment(c.id)} className="text-[11px] text-text-muted hover:text-red-500 press">
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div ref={cardRef} className="bg-bg-card border border-border rounded-2xl px-4 py-4">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${post.user_id}`} className="shrink-0">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt={profile.full_name} width={40} height={40} className="rounded-full object-cover w-10 h-10" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-bg-input flex items-center justify-center">
              <User size={18} className="text-text-muted" />
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${post.user_id}`} className="font-semibold text-[14px] text-text hover:underline truncate">
              {profile?.full_name || 'Anonymous'}
            </Link>
            <span className="text-[12px] text-text-muted shrink-0">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
          <div
            onClick={navigateToPost}
            className={!defaultShowComments ? 'cursor-pointer' : undefined}
          >
            <p className="text-[14px] mt-1 whitespace-pre-wrap break-words">{post.content}</p>
            {(post.media_urls?.length > 0 ? post.media_urls : post.image_url ? [post.image_url] : []).length > 0 && (
              <div className={`grid gap-2 mt-3 ${(post.media_urls?.length || 1) === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {(post.media_urls?.length > 0 ? post.media_urls : [post.image_url!]).map((url, i) => (
                  url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') ? (
                    <video key={i} src={url} controls onClick={(e) => e.stopPropagation()} className="rounded-xl w-full max-h-[300px] object-cover" />
                  ) : (
                    <Image key={i} src={url} alt="Post media" width={500} height={400} className="rounded-xl w-full max-h-[300px] object-cover" />
                  )
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 text-[13px] press ${liked ? 'text-accent' : 'text-text-muted'}`}
            >
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
              {likes > 0 && likes}
            </button>
            <button
              onClick={toggleComments}
              className="flex items-center gap-1.5 text-[13px] text-text-muted press"
            >
              <MessageCircle size={16} />
              {commentCount > 0 && commentCount}
            </button>
            <span className="flex items-center gap-1.5 text-[13px] text-text-muted">
              <Eye size={16} />
              {impressions > 0 && impressions}
            </span>
            {!isOwn && (
              <button
                onClick={() => setShowReport(true)}
                className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-red-500 transition-colors press ml-auto"
              >
                <Flag size={15} />
              </button>
            )}
            {isOwn && !showDeleteConfirm && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-red-500 transition-colors press ml-auto"
              >
                <Trash2 size={15} />
              </button>
            )}
            {showDeleteConfirm && (
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={handleDelete} className="text-[12px] text-red-500 font-semibold press">Delete</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="text-[12px] text-text-muted font-medium press">Cancel</button>
              </div>
            )}
          </div>

          {/* Comment preview in feed (when comments section is not expanded) */}
          {!showComments && previewComments.length > 0 && (
            <div
              className="mt-3 pt-3 border-t border-border space-y-1.5 cursor-pointer"
              onClick={navigateToPost}
            >
              {previewComments.map((c) => renderComment(c, true))}
              {commentCount > 2 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateToPost()
                  }}
                  className="text-[12px] text-text-muted hover:text-text transition-colors"
                >
                  View all {commentCount} comments
                </button>
              )}
            </div>
          )}

          {showComments && (
            <div className="mt-3 pt-3 border-t border-border">
              {loadingComments ? (
                <p className="text-[12px] text-text-muted">Loading...</p>
              ) : (
                <div className="space-y-2">
                  {comments.map((c) => renderComment(c))}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => { if (e.target.value.length <= 5000) setNewComment(e.target.value) }}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  placeholder="Write a comment..."
                  maxLength={5000}
                  className="flex-1 bg-bg-input border border-border rounded-full px-3 py-1.5 text-[13px] placeholder:text-text-muted/50 outline-none focus:border-text-muted transition-colors"
                />
                <button
                  onClick={handleComment}
                  disabled={!newComment.trim() || sending}
                  className="text-accent press disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {showReport && (
        <ReportModal
          type="post"
          targetId={post.id}
          targetUserId={post.user_id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}
