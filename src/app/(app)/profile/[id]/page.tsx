'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Post } from '@/types'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, User, MessageCircle } from 'lucide-react'
import PostCard from '@/components/PostCard'
import Image from 'next/image'

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useRef(createClient()).current
  const router = useRouter()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      // If viewing own profile, redirect
      if (user.id === id) {
        router.push('/profile')
        return
      }
    }

    const [profileRes, postsRes, followersRes, followingRes, isFollowingRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('posts').select('*, profiles(*), likes(user_id)').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id),
      user ? supabase.from('follows').select('*').eq('follower_id', user.id).eq('following_id', id) : Promise.resolve({ data: [] }),
    ])

    if (profileRes.data) setProfile(profileRes.data)
    if (postsRes.data) setPosts(postsRes.data as Post[])
    setFollowers(followersRes.count ?? 0)
    setFollowing(followingRes.count ?? 0)
    setIsFollowing((isFollowingRes.data?.length ?? 0) > 0)
    setLoading(false)
  }, [supabase, id, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFollow = async () => {
    if (!currentUserId) return
    if (isFollowing) {
      setIsFollowing(false)
      setFollowers((f) => f - 1)
      await supabase.from('follows').delete().match({ follower_id: currentUserId, following_id: id })
    } else {
      setIsFollowing(true)
      setFollowers((f) => f + 1)
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: id })
    }
  }

  const handleMessage = async () => {
    if (!currentUserId) return
    // Check if conversation exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${id}),and(user1_id.eq.${id},user2_id.eq.${currentUserId})`)
      .single()

    if (existing) {
      router.push(`/messages/${existing.id}`)
    } else {
      const { data: newConvo } = await supabase
        .from('conversations')
        .insert({ user1_id: currentUserId, user2_id: id })
        .select('id')
        .single()

      if (newConvo) {
        router.push(`/messages/${newConvo.id}`)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 pt-6 text-center">
        <p className="text-text-muted">User not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <button onClick={() => router.back()} className="mb-4 press">
        <ArrowLeft size={22} />
      </button>

      <div className="bg-bg-card border border-border rounded-2xl px-5 py-5 mb-4 animate-slide-up">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt="" width={64} height={64} className="rounded-full w-16 h-16 object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-bg-input flex items-center justify-center">
              <User size={28} className="text-text-muted" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-[18px] font-bold">{profile.full_name || 'Anonymous'}</h2>
            <p className="text-[13px] text-text-muted">{profile.email}</p>
          </div>
        </div>

        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <p className="text-[18px] font-bold">{posts.length}</p>
            <p className="text-[11px] text-text-muted uppercase tracking-wide">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-[18px] font-bold">{followers}</p>
            <p className="text-[11px] text-text-muted uppercase tracking-wide">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-[18px] font-bold">{following}</p>
            <p className="text-[11px] text-text-muted uppercase tracking-wide">Following</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleFollow}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-[14px] press ${
              isFollowing
                ? 'border border-border text-text'
                : 'bg-accent text-white'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          <button
            onClick={handleMessage}
            className="border border-border rounded-xl px-4 py-2.5 press"
          >
            <MessageCircle size={18} />
          </button>
        </div>

        {profile.bio && <p className="text-[14px] mt-4">{profile.bio}</p>}

        <div className="mt-4 space-y-2">
          {profile.major && (
            <div className="flex gap-2 text-[13px]">
              <span className="text-text-muted font-medium">Major:</span>
              <span>{profile.major}</span>
            </div>
          )}
          {profile.second_major && (
            <div className="flex gap-2 text-[13px]">
              <span className="text-text-muted font-medium">Second Major:</span>
              <span>{profile.second_major}</span>
            </div>
          )}
          {profile.minor && (
            <div className="flex gap-2 text-[13px]">
              <span className="text-text-muted font-medium">Minor:</span>
              <span>{profile.minor}</span>
            </div>
          )}
          {profile.clubs && (
            <div className="flex gap-2 text-[13px]">
              <span className="text-text-muted font-medium">Clubs:</span>
              <span>{profile.clubs}</span>
            </div>
          )}
          {profile.courses && (
            <div className="flex gap-2 text-[13px]">
              <span className="text-text-muted font-medium">Spring 2026:</span>
              <span>{profile.courses}</span>
            </div>
          )}
          {profile.residence_hall && (
            <div className="flex gap-2 text-[13px]">
              <span className="text-text-muted font-medium">Residence:</span>
              <span>{profile.residence_hall}</span>
            </div>
          )}
          {profile.meal_plan && (
            <div className="flex gap-2 text-[13px]">
              <span className="text-text-muted font-medium">Meal Plan:</span>
              <span>{profile.meal_plan}</span>
            </div>
          )}
          {profile.relationship_status && (
            <div className="flex gap-2 text-[13px]">
              <span className="text-text-muted font-medium">Status:</span>
              <span>{profile.relationship_status}</span>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-[16px] font-bold mb-3">Posts</h3>
      {posts.length === 0 ? (
        <p className="text-[14px] text-text-muted text-center py-8">No posts yet</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  )
}
