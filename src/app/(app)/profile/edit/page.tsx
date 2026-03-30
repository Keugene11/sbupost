'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Camera } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import Autocomplete from '@/components/Autocomplete'
import CourseSelect from '@/components/CourseSelect'
import { SBU_MAJORS, SBU_MINORS } from '@/lib/sbu-data'

export default function EditProfilePage() {
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [major, setMajor] = useState('')
  const [secondMajor, setSecondMajor] = useState('')
  const [minor, setMinor] = useState('')
  const [clubs, setClubs] = useState('')
  const [courses, setCourses] = useState('')
  const [relationshipStatus, setRelationshipStatus] = useState('')
  const [residenceHall, setResidenceHall] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setFullName(data.full_name || '')
      setBio(data.bio || '')
      setMajor(data.major || '')
      setSecondMajor(data.second_major || '')
      setMinor(data.minor || '')
      setClubs(data.clubs || '')
      setCourses(data.courses || '')
      setRelationshipStatus(data.relationship_status || '')
      setResidenceHall(data.residence_hall || '')
      setAvatarUrl(data.avatar_url)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fileName = `avatars/${user.id}/${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('post-images').upload(fileName, file)

    if (!error) {
      const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(fileName)
      setAvatarUrl(urlData.publicUrl)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('profiles').update({
      full_name: fullName,
      bio,
      major,
      second_major: secondMajor,
      minor,
      clubs,
      courses,
      relationship_status: relationshipStatus,
      residence_hall: residenceHall,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)

    setSaving(false)
    router.push('/profile')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    )
  }

  const inputClass = "w-full bg-bg-card border border-border rounded-xl px-4 py-2.5 text-[14px] placeholder:text-text-muted/50 outline-none focus:border-text-muted transition-colors"

  return (
    <div className="max-w-md mx-auto px-4 pt-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile" className="press">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-[22px] font-extrabold tracking-tight">Edit Profile</h1>
      </div>

      <div className="flex justify-center mb-6">
        <label className="relative cursor-pointer">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={80} height={80} className="rounded-full w-20 h-20 object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-bg-input flex items-center justify-center">
              <Camera size={24} className="text-text-muted" />
            </div>
          )}
          <div className="absolute bottom-0 right-0 bg-accent text-white rounded-full p-1.5">
            <Camera size={12} />
          </div>
          <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
        </label>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[12px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Full Name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Your name" />
        </div>
        <div>
          <label className="text-[12px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="Tell us about yourself" />
        </div>
        <div>
          <label className="text-[12px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Major</label>
          <Autocomplete value={major} onChange={setMajor} suggestions={SBU_MAJORS} placeholder="e.g. Computer Science" className={inputClass} />
        </div>
        <div>
          <label className="text-[12px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Second Major</label>
          <Autocomplete value={secondMajor} onChange={setSecondMajor} suggestions={SBU_MAJORS} placeholder="Optional" className={inputClass} />
        </div>
        <div>
          <label className="text-[12px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Minor</label>
          <Autocomplete value={minor} onChange={setMinor} suggestions={SBU_MINORS} placeholder="Optional" className={inputClass} />
        </div>
        <div>
          <label className="text-[12px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Clubs</label>
          <input value={clubs} onChange={(e) => setClubs(e.target.value)} className={inputClass} placeholder="e.g. SBU Hacks, CEAS" />
        </div>
        <div>
          <label className="text-[12px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Spring 2026 Courses</label>
          <CourseSelect value={courses} onChange={setCourses} className={inputClass} />
        </div>
        <div>
          <label className="text-[12px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Residence Hall</label>
          <select value={residenceHall} onChange={(e) => setResidenceHall(e.target.value)} className={inputClass}>
            <option value="">Select residence hall</option>
            <optgroup label="Roosevelt Community">
              <option value="Keller Hall">Keller Hall</option>
              <option value="Greeley Hall">Greeley Hall</option>
              <option value="Wagner Hall">Wagner Hall</option>
            </optgroup>
            <optgroup label="H Community">
              <option value="Benedict Hall">Benedict Hall</option>
              <option value="James Hall">James Hall</option>
              <option value="Langmuir Hall">Langmuir Hall</option>
            </optgroup>
            <optgroup label="Mendelsohn Community">
              <option value="Ammann Hall">Ammann Hall</option>
              <option value="Gray Hall">Gray Hall</option>
              <option value="Irving Hall">Irving Hall</option>
              <option value="O'Neill Hall">O&apos;Neill Hall</option>
            </optgroup>
            <optgroup label="Kelly Community">
              <option value="Dewey Hall">Dewey Hall</option>
              <option value="Eisenhower Hall">Eisenhower Hall</option>
              <option value="Hamilton Hall">Hamilton Hall</option>
              <option value="Schick Hall">Schick Hall</option>
            </optgroup>
            <optgroup label="Roth Community">
              <option value="Cardozo Hall">Cardozo Hall</option>
              <option value="Gershwin Hall">Gershwin Hall</option>
              <option value="Hendrix Hall">Hendrix Hall</option>
              <option value="Mount Hall">Mount Hall</option>
              <option value="Whitman Hall">Whitman Hall</option>
            </optgroup>
            <optgroup label="Tabler Community">
              <option value="Dreiser Hall">Dreiser Hall</option>
              <option value="Hand Hall">Hand Hall</option>
              <option value="Sanger Hall">Sanger Hall</option>
              <option value="Toscanini Hall">Toscanini Hall</option>
            </optgroup>
            <optgroup label="Other Halls">
              <option value="Lauterbur Hall">Lauterbur Hall</option>
              <option value="Stimson Hall">Stimson Hall</option>
              <option value="Yang Hall">Yang Hall</option>
              <option value="Chavez Hall">Chavez Hall</option>
              <option value="Tubman Hall">Tubman Hall</option>
            </optgroup>
            <optgroup label="Apartments">
              <option value="West Apartments">West Apartments</option>
              <option value="Chapin Apartments">Chapin Apartments</option>
              <option value="Schomburg Apartments">Schomburg Apartments</option>
            </optgroup>
            <option value="Off Campus">Off Campus</option>
          </select>
        </div>
        <div>
          <label className="text-[12px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Relationship Status</label>
          <select value={relationshipStatus} onChange={(e) => setRelationshipStatus(e.target.value)} className={inputClass}>
            <option value="">Prefer not to say</option>
            <option value="Single">Single</option>
            <option value="In a relationship">In a relationship</option>
            <option value="Complicated">It&apos;s complicated</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-accent text-white py-3 rounded-2xl font-semibold press mt-6 mb-8 flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
      </button>
    </div>
  )
}
