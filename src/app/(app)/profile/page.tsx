'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Post } from '@/types'
import { LogOut, Loader2, User, Camera, Check, Trash2 } from 'lucide-react'
import PostCard from '@/components/PostCard'
import Autocomplete from '@/components/Autocomplete'
import CourseSelect from '@/components/CourseSelect'
import { SBU_MAJORS, SBU_MINORS } from '@/lib/sbu-data'
import Image from 'next/image'
import FollowListModal from '@/components/FollowListModal'
import ProfileViewers from '@/components/ProfileViewers'
import StyledSelect from '@/components/StyledSelect'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showFollowList, setShowFollowList] = useState<'followers' | 'following' | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [major, setMajor] = useState('')
  const [secondMajor, setSecondMajor] = useState('')
  const [minor, setMinor] = useState('')
  const [clubs, setClubs] = useState('')
  const [courses, setCourses] = useState('')
  const [relationshipStatus, setRelationshipStatus] = useState('')
  const [residenceHall, setResidenceHall] = useState('')
  const [mealPlan, setMealPlan] = useState('')
  const [username, setUsername] = useState('')
  const [usernameChangedAt, setUsernameChangedAt] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const supabaseRef = useRef(createClient())
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = supabaseRef.current
    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const [profileRes, postsRes, followersRes, followingRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('posts').select('*, profiles!posts_user_id_fkey(*), likes(user_id), post_impressions(post_id)').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
        ])

        if (profileRes.data) {
          const p = profileRes.data
          setProfile(p)
          setFullName(p.full_name || '')
          setBio(p.bio || '')
          setMajor(p.major || '')
          setSecondMajor(p.second_major || '')
          setMinor(p.minor || '')
          setClubs(p.clubs || '')
          setCourses(p.courses || '')
          setRelationshipStatus(p.relationship_status || '')
          setResidenceHall(p.residence_hall || '')
          setMealPlan(p.meal_plan || '')
          setUsername(p.username || '')
          setUsernameChangedAt(p.username_changed_at)
          setAvatarUrl(p.avatar_url)
        }
        if (postsRes.data) setPosts(postsRes.data as Post[])
        setFollowers(followersRes.count ?? 0)
        setFollowing(followingRes.count ?? 0)
      } catch {
        // Profile load failed
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
    }
  }, [])

  const autoSave = (updates: Record<string, unknown>) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      setSaving(true)
      setSaved(false)
      const supabase = supabaseRef.current
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('profiles').update({
        ...updates,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 800)
  }

  const canChangeUsername = !usernameChangedAt ||
    (Date.now() - new Date(usernameChangedAt).getTime()) > 30 * 24 * 60 * 60 * 1000

  const saveUsername = async (newUsername: string) => {
    setUsername(newUsername)
    setUsernameError('')
    if (!newUsername.trim()) return

    if (!canChangeUsername) {
      const daysLeft = Math.ceil((30 * 24 * 60 * 60 * 1000 - (Date.now() - new Date(usernameChangedAt!).getTime())) / (24 * 60 * 60 * 1000))
      setUsernameError(`You can change your username again in ${daysLeft} days`)
      return
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(newUsername)) {
      setUsernameError('3-20 characters, letters, numbers, underscores only')
      return
    }

    const supabase = supabaseRef.current
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', newUsername)
      .neq('id', user.id)
      .single()

    if (existing) {
      setUsernameError('Username already taken')
      return
    }

    const { error } = await supabase.from('profiles').update({
      username: newUsername,
      username_changed_at: new Date().toISOString(),
    }).eq('id', user.id)

    if (error) {
      setUsernameError('Failed to save username')
    } else {
      setUsernameChangedAt(new Date().toISOString())
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const updateField = (field: string, value: string, setter: (v: string) => void) => {
    setter(value)
    autoSave({ [field]: value })
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Profile photo must be under 5MB')
      return
    }
    const supabase = supabaseRef.current
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (avatarUrl) {
      const oldPath = avatarUrl.split('/post-images/')[1]
      if (oldPath) {
        await supabase.storage.from('post-images').remove([decodeURIComponent(oldPath)])
      }
    }

    const fileName = `avatars/${user.id}/${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('post-images').upload(fileName, file)
    if (error) {
      alert('Failed to upload photo. Please try again.')
      return
    }
    const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(fileName)
    setAvatarUrl(urlData.publicUrl)
    autoSave({ avatar_url: urlData.publicUrl })
  }

  const handleLogout = async () => {
    await supabaseRef.current.auth.signOut()
    window.location.href = '/login'
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/delete-account', { method: 'DELETE' })
      if (res.ok) {
        window.location.href = '/login'
      } else {
        alert('Failed to delete account. Please try again.')
        setDeleting(false)
      }
    } catch {
      alert('Failed to delete account. Please try again.')
      setDeleting(false)
    }
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

  const inputClass = "w-full bg-bg-card border border-border rounded-xl px-3 py-2 text-[14px] placeholder:text-text-muted/50 outline-none focus:border-text-muted transition-colors"

  return (
    <div className="max-w-md md:max-w-xl mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[24px] font-extrabold tracking-tight">Profile</h1>
        <div className="flex items-center gap-2">
          {saving && <span className="text-[12px] text-text-muted animate-pulse">Saving...</span>}
          {saved && !saving && (
            <span className="flex items-center gap-1 text-[12px] text-green-600 font-medium animate-fade-in">
              <Check size={14} /> Saved
            </span>
          )}
          <button onClick={handleLogout} className="border border-border rounded-full p-2 press">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-2xl px-5 py-5 mb-4 animate-slide-up">
        <div className="flex items-center gap-4 mb-4">
          <label className="relative cursor-pointer shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" width={64} height={64} className="rounded-full w-16 h-16 object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-bg-input flex items-center justify-center">
                <User size={28} className="text-text-muted" />
              </div>
            )}
            <div className="absolute bottom-0 right-0 bg-accent text-white rounded-full p-1">
              <Camera size={10} />
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
          <div className="flex-1 min-w-0">
            <input value={fullName} onChange={(e) => updateField('full_name', e.target.value, setFullName)} placeholder="Your name" className="font-bold text-[18px] bg-transparent outline-none w-full placeholder:text-text-muted/50" />
            <p className="text-[13px] text-text-muted">{profile?.email}</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Username</label>
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-text-muted">@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
              onBlur={() => { if (username) saveUsername(username) }}
              placeholder="username"
              disabled={!canChangeUsername}
              className="flex-1 bg-transparent border-b border-border text-[14px] py-1 outline-none focus:border-text-muted transition-colors placeholder:text-text-muted/50 disabled:opacity-50"
            />
          </div>
          {usernameError && <p className="text-[11px] text-red-500 mt-1">{usernameError}</p>}
          {!canChangeUsername && !usernameError && (
            <p className="text-[11px] text-text-muted mt-1">Username can be changed every 30 days</p>
          )}
        </div>

        <div className="flex gap-6 mb-4 pb-4 border-b border-border">
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

        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Bio</label>
            <textarea value={bio} onChange={(e) => updateField('bio', e.target.value, setBio)} placeholder="Tell us about yourself" className={`${inputClass} resize-none`} rows={2} />
          </div>
          <div>
            <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Major</label>
            <Autocomplete value={major} onChange={(v) => updateField('major', v, setMajor)} suggestions={SBU_MAJORS} placeholder="Select major" className={inputClass} />
          </div>
          <div>
            <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Second Major</label>
            <Autocomplete value={secondMajor} onChange={(v) => updateField('second_major', v, setSecondMajor)} suggestions={SBU_MAJORS} placeholder="Optional" className={inputClass} />
          </div>
          <div>
            <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Minor</label>
            <Autocomplete value={minor} onChange={(v) => updateField('minor', v, setMinor)} suggestions={SBU_MINORS} placeholder="Optional" className={inputClass} />
          </div>
          <div>
            <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Clubs</label>
            <input value={clubs} onChange={(e) => updateField('clubs', e.target.value, setClubs)} placeholder="e.g. SBU Hacks, CEAS" className={inputClass} />
          </div>
          <div>
            <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Spring 2026 Courses</label>
            <CourseSelect value={courses} onChange={(v) => updateField('courses', v, setCourses)} className={inputClass} />
          </div>
          <div>
            <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Residence Hall</label>
            <StyledSelect
              value={residenceHall}
              onChange={(v) => updateField('residence_hall', v, setResidenceHall)}
              placeholder="Select residence hall"
              searchable
              options={[
                { value: "Greeley Hall", label: "Greeley Hall", group: "Eleanor Roosevelt" },
                { value: "Keller Hall", label: "Keller Hall", group: "Eleanor Roosevelt" },
                { value: "Stimson Hall", label: "Stimson Hall", group: "Eleanor Roosevelt" },
                { value: "Wagner Hall", label: "Wagner Hall", group: "Eleanor Roosevelt" },
                { value: "Benedict North", label: "Benedict North", group: "H Community" },
                { value: "Benedict South", label: "Benedict South", group: "H Community" },
                { value: "James Hall", label: "James Hall", group: "H Community" },
                { value: "Langmuir Hall", label: "Langmuir Hall", group: "H Community" },
                { value: "Ammann Hall", label: "Ammann Hall", group: "Mendelsohn" },
                { value: "Gray Hall", label: "Gray Hall", group: "Mendelsohn" },
                { value: "Irving Hall", label: "Irving Hall", group: "Mendelsohn" },
                { value: "O'Neill Hall", label: "O'Neill Hall", group: "Mendelsohn" },
                { value: "Baruch Hall", label: "Baruch Hall", group: "Kelly" },
                { value: "Dewey Hall", label: "Dewey Hall", group: "Kelly" },
                { value: "Eisenhower Hall", label: "Eisenhower Hall", group: "Kelly" },
                { value: "Hamilton Hall", label: "Hamilton Hall", group: "Kelly" },
                { value: "Schick Hall", label: "Schick Hall", group: "Kelly" },
                { value: "Cardozo Hall", label: "Cardozo Hall", group: "Roth" },
                { value: "Gershwin Hall", label: "Gershwin Hall", group: "Roth" },
                { value: "Hendrix Hall", label: "Hendrix Hall", group: "Roth" },
                { value: "Mount Hall", label: "Mount Hall", group: "Roth" },
                { value: "Whitman Hall", label: "Whitman Hall", group: "Roth" },
                { value: "Chinn Hall", label: "Chinn Hall", group: "Tabler" },
                { value: "Douglass Hall", label: "Douglass Hall", group: "Tabler" },
                { value: "Dreiser Hall", label: "Dreiser Hall", group: "Tabler" },
                { value: "Hand Hall", label: "Hand Hall", group: "Tabler" },
                { value: "Toscanini Hall", label: "Toscanini Hall", group: "Tabler" },
                { value: "West Apartments", label: "West Apartments", group: "Apartments" },
                { value: "Chapin Apartments", label: "Chapin Apartments", group: "Apartments" },
                { value: "Schomburg Apartments", label: "Schomburg Apartments", group: "Apartments" },
                { value: "Off Campus", label: "Off Campus" },
              ]}
            />
          </div>
          <div>
            <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Meal Plan</label>
            <StyledSelect
              value={mealPlan}
              onChange={(v) => updateField('meal_plan', v, setMealPlan)}
              placeholder="Select meal plan"
              options={[
                { value: "Unlimited", label: "Unlimited" },
                { value: "Block 110", label: "Block 110" },
                { value: "2600 Dining Dollars", label: "2600 Dining Dollars" },
                { value: "Commuter 550", label: "Commuter 550" },
                { value: "Apartment 550", label: "Apartment 550" },
                { value: "Seawolves Performance Plan", label: "Seawolves Performance Plan" },
                { value: "Budget Plan", label: "Budget Plan" },
                { value: "No Meal Plan", label: "No Meal Plan" },
              ]}
            />
          </div>
          <div>
            <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Relationship Status</label>
            <StyledSelect
              value={relationshipStatus}
              onChange={(v) => updateField('relationship_status', v, setRelationshipStatus)}
              placeholder="Prefer not to say"
              options={[
                { value: "Prefer not to say", label: "Prefer not to say" },
                { value: "Single", label: "Single" },
                { value: "In a relationship", label: "In a relationship" },
                { value: "Complicated", label: "It's complicated" },
              ]}
            />
          </div>
        </div>
      </div>

      {profile && <ProfileViewers userId={profile.id} />}

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

      <div className="mt-8 mb-4 flex items-center justify-center gap-4 text-[13px] text-text-muted">
        <button onClick={() => { navigator.clipboard.writeText('keugenelee11@gmail.com'); alert('Support email: keugenelee11@gmail.com\n\nCopied to clipboard!') }} className="hover:text-text transition-colors press">Support</button>
        <span>·</span>
        <a href="/privacy" className="hover:text-text transition-colors">Privacy</a>
        <span>·</span>
        <a href="/terms" className="hover:text-text transition-colors">Terms</a>
      </div>

      <div className="mb-6 border-t border-border pt-6">
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 text-red-500 text-[14px] font-medium press"
          >
            <Trash2 size={16} />
            Delete Account
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 animate-slide-up">
            <p className="text-[14px] text-red-700 font-medium mb-3">
              Are you sure? This will permanently delete your account and all your data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold text-[14px] press flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : 'Delete My Account'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 bg-bg-card border border-border py-2.5 rounded-xl font-semibold text-[14px] press disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {showFollowList && profile && (
        <FollowListModal
          userId={profile.id}
          type={showFollowList}
          onClose={() => setShowFollowList(null)}
        />
      )}
    </div>
  )
}
