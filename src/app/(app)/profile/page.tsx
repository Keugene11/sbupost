'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Post } from '@/types'
import { useRouter } from 'next/navigation'
import { Settings, LogOut, Loader2, User } from 'lucide-react'
import PostCard from '@/components/PostCard'
import Link from 'next/link'
import Image from 'next/image'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, postsRes, followersRes, followingRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('posts').select('*, profiles(*), likes(user_id)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
    ])

    if (profileRes.data) setProfile(profileRes.data)
    if (postsRes.data) setPosts(postsRes.data as Post[])
    setFollowers(followersRes.count ?? 0)
    setFollowing(followingRes.count ?? 0)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-extrabold tracking-tight">Profile</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/profile/edit"
            className="border border-border rounded-full p-2 press"
          >
            <Settings size={18} />
          </Link>
          <button onClick={handleLogout} className="border border-border rounded-full p-2 press">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-2xl px-5 py-5 mb-4 animate-slide-up">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt="" width={64} height={64} className="rounded-full w-16 h-16 object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-bg-input flex items-center justify-center">
              <User size={28} className="text-text-muted" />
            </div>
          )}
          <div>
            <h2 className="text-[18px] font-bold">{profile?.full_name || 'No name set'}</h2>
            <p className="text-[13px] text-text-muted">{profile?.email}</p>
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

        {profile?.bio && <p className="text-[14px] mt-4">{profile.bio}</p>}

        <div className="mt-4 space-y-2">
          {profile?.major && (
            <div className="flex gap-2 text-[13px]">
              <span className="text-text-muted font-medium">Major:</span>
              <span>{profile.major}</span>
            </div>
          )}
          {profile?.second_major && (
            <div className="flex gap-2 text-[13px]">
              <span className="text-text-muted font-medium">Second Major:</span>
              <span>{profile.second_major}</span>
            </div>
          )}
          {profile?.minor && (
            <div className="flex gap-2 text-[13px]">
              <span className="text-text-muted font-medium">Minor:</span>
              <span>{profile.minor}</span>
            </div>
          )}
          {profile?.clubs && (
            <div className="flex gap-2 text-[13px]">
              <span className="text-text-muted font-medium">Clubs:</span>
              <span>{profile.clubs}</span>
            </div>
          )}
          {profile?.courses && (
            <div className="flex gap-2 text-[13px]">
              <span className="text-text-muted font-medium">Spring 2026:</span>
              <span>{profile.courses}</span>
            </div>
          )}
          {profile?.residence_hall && (
            <div className="flex gap-2 text-[13px]">
              <span className="text-text-muted font-medium">Residence:</span>
              <span>{profile.residence_hall}</span>
            </div>
          )}
          {profile?.relationship_status && (
            <div className="flex gap-2 text-[13px]">
              <span className="text-text-muted font-medium">Status:</span>
              <span>{profile.relationship_status}</span>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-[16px] font-bold mb-3">Your Posts</h3>
      {posts.length === 0 ? (
        <p className="text-[14px] text-text-muted text-center py-8">No posts yet</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={profile?.id ?? null} onDeleted={handlePostDeleted} />
          ))}
        </div>
      )}
    </div>
  )
}
