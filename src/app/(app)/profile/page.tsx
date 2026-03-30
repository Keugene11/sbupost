'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Post } from '@/types'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2, User, Camera, Check } from 'lucide-react'
import PostCard from '@/components/PostCard'
import Autocomplete from '@/components/Autocomplete'
import CourseSelect from '@/components/CourseSelect'
import { SBU_MAJORS, SBU_MINORS } from '@/lib/sbu-data'
import Image from 'next/image'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Editable fields
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, postsRes, followersRes, followingRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('posts').select('*, profiles(*), likes(user_id)').eq('user_id', user.id).order('created_at', { ascending: false }),
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
      setAvatarUrl(p.avatar_url)
    }
    if (postsRes.data) setPosts(postsRes.data as Post[])
    setFollowers(followersRes.count ?? 0)
    setFollowing(followingRes.count ?? 0)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Auto-save with debounce
  const autoSave = useCallback(async (updates: Record<string, unknown>) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      setSaving(true)
      setSaved(false)
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
  }, [supabase])

  const updateField = (field: string, value: string, setter: (v: string) => void) => {
    setter(value)
    autoSave({ [field]: value })
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Delete old avatar if it exists
    if (avatarUrl) {
      const oldPath = avatarUrl.split('/post-images/')[1]
      if (oldPath) {
        await supabase.storage.from('post-images').remove([decodeURIComponent(oldPath)])
      }
    }

    const fileName = `avatars/${user.id}/${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('post-images').upload(fileName, file)
    if (!error) {
      const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(fileName)
      setAvatarUrl(urlData.publicUrl)
      autoSave({ avatar_url: urlData.publicUrl })
    }
  }

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

  const inputClass = "w-full bg-bg-card border border-border rounded-xl px-3 py-2 text-[14px] placeholder:text-text-muted/50 outline-none focus:border-text-muted transition-colors"

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
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

        <div className="flex gap-6 mb-4 pb-4 border-b border-border">
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
            <select value={residenceHall} onChange={(e) => updateField('residence_hall', e.target.value, setResidenceHall)} className={inputClass}>
              <option value="">Select residence hall</option>
              <optgroup label="Eleanor Roosevelt Community"><option value="Greeley Hall">Greeley Hall</option><option value="Keller Hall">Keller Hall</option><option value="Stimson Hall">Stimson Hall</option><option value="Wagner Hall">Wagner Hall</option></optgroup>
              <optgroup label="H Community"><option value="Benedict North">Benedict North</option><option value="Benedict South">Benedict South</option><option value="James Hall">James Hall</option><option value="Langmuir Hall">Langmuir Hall</option></optgroup>
              <optgroup label="Mendelsohn Community"><option value="Ammann Hall">Ammann Hall</option><option value="Gray Hall">Gray Hall</option><option value="Irving Hall">Irving Hall</option><option value="O'Neill Hall">O&apos;Neill Hall</option></optgroup>
              <optgroup label="Kelly Community"><option value="Baruch Hall">Baruch Hall</option><option value="Dewey Hall">Dewey Hall</option><option value="Eisenhower Hall">Eisenhower Hall</option><option value="Hamilton Hall">Hamilton Hall</option><option value="Schick Hall">Schick Hall</option></optgroup>
              <optgroup label="Roth Community"><option value="Cardozo Hall">Cardozo Hall</option><option value="Gershwin Hall">Gershwin Hall</option><option value="Hendrix Hall">Hendrix Hall</option><option value="Mount Hall">Mount Hall</option><option value="Whitman Hall">Whitman Hall</option></optgroup>
              <optgroup label="Tabler Community"><option value="Chinn Hall">Chinn Hall</option><option value="Douglass Hall">Douglass Hall</option><option value="Dreiser Hall">Dreiser Hall</option><option value="Hand Hall">Hand Hall</option><option value="Toscanini Hall">Toscanini Hall</option></optgroup>

              <optgroup label="Apartments"><option value="West Apartments">West Apartments</option><option value="Chapin Apartments">Chapin Apartments</option><option value="Schomburg Apartments">Schomburg Apartments</option></optgroup>
              <option value="Off Campus">Off Campus</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Meal Plan</label>
            <select value={mealPlan} onChange={(e) => updateField('meal_plan', e.target.value, setMealPlan)} className={inputClass}>
              <option value="">Select meal plan</option>
              <option value="Unlimited">Unlimited</option>
              <option value="Block 110">Block 110</option>
              <option value="2600 Dining Dollars">2600 Dining Dollars</option>
              <option value="Commuter 550">Commuter 550</option>
              <option value="Apartment 550">Apartment 550</option>
              <option value="Seawolves Performance Plan">Seawolves Performance Plan</option>
              <option value="Budget Plan">Budget Plan</option>
              <option value="No Meal Plan">No Meal Plan</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Relationship Status</label>
            <select value={relationshipStatus} onChange={(e) => updateField('relationship_status', e.target.value, setRelationshipStatus)} className={inputClass}>
              <option value="">Prefer not to say</option>
              <option value="Single">Single</option>
              <option value="In a relationship">In a relationship</option>
              <option value="Complicated">It&apos;s complicated</option>
            </select>
          </div>
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
