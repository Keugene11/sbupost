'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Post } from '@/types'
import { Heart, Trash2, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'

interface PostCardProps {
  post: Post
  currentUserId: string | null
  onDeleted?: (postId: string) => void
}

export default function PostCard({ post, currentUserId, onDeleted }: PostCardProps) {
  const supabase = createClient()
  const [likes, setLikes] = useState(post.likes?.length ?? 0)
  const [liked, setLiked] = useState(
    post.likes?.some((l) => l.user_id === currentUserId) ?? false
  )
  const [deleting, setDeleting] = useState(false)
  const isOwn = currentUserId === post.user_id

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

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return
    setDeleting(true)
    await supabase.from('posts').delete().eq('id', post.id)
    onDeleted?.(post.id)
  }

  const profile = post.profiles

  return (
    <div className="bg-bg-card border border-border rounded-2xl px-4 py-4">
      <div className="flex items-start gap-3">
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${post.user_id}`}
              className="font-semibold text-[14px] text-text hover:underline truncate"
            >
              {profile?.full_name || 'Anonymous'}
            </Link>
            <span className="text-[12px] text-text-muted shrink-0">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-[14px] mt-1 whitespace-pre-wrap break-words">{post.content}</p>
          {post.image_url && (
            <Image
              src={post.image_url}
              alt="Post image"
              width={500}
              height={400}
              className="rounded-xl mt-3 w-full max-h-[300px] object-cover"
            />
          )}
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 text-[13px] press ${
                liked ? 'text-accent' : 'text-text-muted'
              }`}
            >
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
              {likes > 0 && likes}
            </button>
            {isOwn && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-red-500 transition-colors press ml-auto"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
