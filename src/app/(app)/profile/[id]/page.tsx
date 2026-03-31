'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Post } from '@/types'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, User, MessageCircle, GraduationCap, Building, BookOpen, Users, Utensils, Heart, Loader2 } from 'lucide-react'
import PostCard from '@/components/PostCard'
import Image from 'next/image'
import Link from 'next/link'
import FollowListModal from '@/components/FollowListModal'

function ProfileSkeleton() {
  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-10">
      <div className="mb-4 w-6 h-6 rounded bg-bg-input animate-pulse" />
      <div className="bg-bg-card border border-border rounded-2xl px-5 py-6 mb-5 animate-pulse">
        <div className="flex flex-col items-center mb-5">
          <div className="w-20 h-20 rounded-full bg-bg-input mb-3" />
          <div className="h-5 bg-bg-input rounded-full w-36 mb-2" />
          <div className="h-3.5 bg-bg-input rounded-full w-24" />
        </div>
        <div className="flex justify-center gap-8 mb-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-1.5">
              <div className="h-5 bg-bg-input rounded w-8 mx-auto" />
              <div className="h-3 bg-bg-input rounded w-14 mx-auto" />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-5">
          <div className="flex-1 h-11 bg-bg-input rounded-xl" />
          <div className="w-11 h-11 bg-bg-input rounded-xl" />
        </div>
        <div className="space-y-2">
          <div className="h-3.5 bg-bg-input rounded-full w-full" />
          <div className="h-3.5 bg-bg-input rounded-full w-3/4" />
        </div>
      </div>
      <div className="h-4 bg-bg-input rounded w-16 mb-3" />
      {[1, 2].map((i) => (
        <div key={i} className="bg-bg-card border border-border rounded-2xl p-4 mb-3 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-bg-input" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 bg-bg-input rounded w-24" />
              <div className="h-3 bg-bg-input rounded w-16" />
            </div>
          </div>
          <div className="h-3.5 bg-bg-input rounded w-full mb-1.5" />
          <div className="h-3.5 bg-bg-input rounded w-2/3" />
        </div>
      ))}
    </div>
  )
}

function InfoChip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 bg-bg-input/60 rounded-xl px-3 py-2">
      <span className="text-text-muted shrink-0">{icon}</span>
      <span className="text-[13px] text-text">{children}</span>
    </div>
  )
}

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [messageLoading, setMessageLoading] = useState(false)
  const [showFollowList, setShowFollowList] = useState<'followers' | 'following' | null>(null)
  const supabase = useRef(createClient()).current
  const router = useRouter()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      if (user.id === id) {
        router.push('/profile')
        return
      }
    }

    const [profileRes, postsRes, followersRes, followingRes, isFollowingRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('posts').select('*, profiles!posts_user_id_fkey(*), likes(user_id), post_impressions(post_id)').eq('user_id', id).order('created_at', { ascending: false }),
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

    if (user) {
      await supabase.from('profile_views').upsert(
        { profile_id: id, viewer_id: user.id, viewed_at: new Date().toISOString() },
        { onConflict: 'profile_id,viewer_id' }
      )
    }
  }, [supabase, id, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFollow = async () => {
    if (!currentUserId || followLoading) return
    setFollowLoading(true)
    if (isFollowing) {
      setIsFollowing(false)
      setFollowers((f) => f - 1)
      await supabase.from('follows').delete().match({ follower_id: currentUserId, following_id: id })
    } else {
      setIsFollowing(true)
      setFollowers((f) => f + 1)
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: id })
    }
    setFollowLoading(false)
  }

  const handleMessage = async () => {
    if (!currentUserId || messageLoading) return
    setMessageLoading(true)
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
    setMessageLoading(false)
  }

  if (loading) {
    return <ProfileSkeleton />
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 pt-6 text-center">
        <button onClick={() => router.back()} className="mb-4 press block">
          <ArrowLeft size={22} />
        </button>
        <div className="py-16">
          <div className="w-16 h-16 rounded-full bg-bg-input flex items-center justify-center mx-auto mb-4">
            <User size={28} className="text-text-muted/50" />
          </div>
          <p className="text-[15px] font-semibold text-text-muted">User not found</p>
        </div>
      </div>
    )
  }

  const hasDetails = profile.major || profile.second_major || profile.minor || profile.clubs || profile.courses || profile.residence_hall || profile.meal_plan || profile.relationship_status

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-10">
      <button onClick={() => router.back()} className="mb-4 press">
        <ArrowLeft size={22} />
      </button>

      <div className="bg-bg-card border border-border rounded-2xl px-5 py-6 mb-5 animate-slide-up">
        {/* Avatar & Name - centered like Instagram */}
        <div className="flex flex-col items-center mb-5">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt="" width={80} height={80} className="rounded-full w-20 h-20 object-cover mb-3" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-bg-input flex items-center justify-center mb-3">
              <User size={32} className="text-text-muted" />
            </div>
          )}
          <h2 className="text-[20px] font-bold tracking-tight">{profile.full_name || 'Anonymous'}</h2>
          {profile.username && <p className="text-[14px] text-text-muted mt-0.5">@{profile.username}</p>}
        </div>

        {/* Stats row */}
        <div className="flex justify-center gap-8 mb-5">
          <div className="text-center">
            <p className="text-[18px] font-bold">{posts.length}</p>
            <p className="text-[11px] text-text-muted uppercase tracking-wide">Posts</p>
          </div>
          <button className="text-center press" onClick={() => setShowFollowList('followers')}>
            <p className="text-[18px] font-bold">{followers}</p>
            <p className="text-[11px] text-text-muted uppercase tracking-wide">Followers</p>
          </button>
          <button className="text-center press" onClick={() => setShowFollowList('following')}>
            <p className="text-[18px] font-bold">{following}</p>
            <p className="text-[11px] text-text-muted uppercase tracking-wide">Following</p>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-[14px] press transition-colors disabled:opacity-60 ${
              isFollowing
                ? 'border border-border text-text'
                : 'bg-accent text-white'
            }`}
          >
            {followLoading ? (
              <Loader2 size={16} className="animate-spin mx-auto" />
            ) : (
              isFollowing ? 'Following' : 'Follow'
            )}
          </button>
          <button
            onClick={handleMessage}
            disabled={messageLoading}
            className="border border-border rounded-xl px-4 py-2.5 press disabled:opacity-60"
          >
            {messageLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <MessageCircle size={18} />
            )}
          </button>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-[14px] leading-relaxed mb-5">{profile.bio}</p>
        )}

        {/* Profile details as chips */}
        {hasDetails && (
          <div className="space-y-2">
            {profile.major && (
              <InfoChip icon={<GraduationCap size={16} />}>{profile.major}</InfoChip>
            )}
            {profile.second_major && (
              <InfoChip icon={<GraduationCap size={16} />}>{profile.second_major}</InfoChip>
            )}
            {profile.minor && (
              <InfoChip icon={<BookOpen size={16} />}>{profile.minor}</InfoChip>
            )}
            {profile.clubs && (
              <InfoChip icon={<Users size={16} />}>{profile.clubs}</InfoChip>
            )}
            {profile.courses && (
              <InfoChip icon={<BookOpen size={16} />}>Spring 2026: {profile.courses}</InfoChip>
            )}
            {profile.residence_hall && (
              <InfoChip icon={<Building size={16} />}>{profile.residence_hall}</InfoChip>
            )}
            {profile.meal_plan && (
              <InfoChip icon={<Utensils size={16} />}>{profile.meal_plan}</InfoChip>
            )}
            {profile.relationship_status && (
              <InfoChip icon={<Heart size={16} />}>{profile.relationship_status}</InfoChip>
            )}
          </div>
        )}
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

      {showFollowList && (
        <FollowListModal
          userId={id}
          type={showFollowList}
          onClose={() => setShowFollowList(null)}
        />
      )}
    </div>
  )
}
