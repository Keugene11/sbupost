'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import Image from 'next/image'

const MAX_CHARS = 5000
const MAX_FILES = 4
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

export default function CreatePost({ onPostCreated }: { onPostCreated: () => void }) {
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<{ url: string; type: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = useRef(createClient()).current

  // Fetch current user avatar
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)
          })
      }
    })
  }, [supabase])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }, [content])

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    const remaining = MAX_FILES - files.length
    const toAdd: File[] = []
    setError('')

    for (const file of selected.slice(0, remaining)) {
      const isVideo = file.type.startsWith('video/')
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
      if (file.size > maxSize) {
        setError(`${file.name} is too large. Max ${isVideo ? '50MB' : '5MB'} for ${isVideo ? 'videos' : 'images'}.`)
        continue
      }
      toAdd.push(file)
    }

    setFiles((prev) => [...prev, ...toAdd])
    setPreviews((prev) => [
      ...prev,
      ...toAdd.map((f) => ({ url: URL.createObjectURL(f), type: f.type })),
    ])
    if (fileRef.current) fileRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!content.trim() && files.length === 0) return
    if (content.length > MAX_CHARS) return
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      setError('You must be signed in to post.')
      return
    }

    const mediaUrls: string[] = []

    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const { error } = await supabase.storage.from('post-images').upload(fileName, file)
      if (!error) {
        const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(fileName)
        mediaUrls.push(urlData.publicUrl)
      }
    }

    const postData: Record<string, unknown> = {
      user_id: user.id,
      content: content.trim(),
      image_url: mediaUrls[0] || null,
    }
    if (mediaUrls.length > 0) {
      postData.media_urls = mediaUrls
    }

    const { error: insertError } = await supabase.from('posts').insert(postData)

    if (insertError) {
      setError('Failed to create post. Please try again.')
      setLoading(false)
      return
    }

    setContent('')
    setFiles([])
    setPreviews([])
    setLoading(false)
    setFocused(false)
    onPostCreated()
  }

  const charsLeft = MAX_CHARS - content.length
  const hasContent = content.trim().length > 0 || files.length > 0
  const showExpanded = focused || hasContent

  return (
    <div className="bg-bg-card border border-border rounded-2xl mb-4 animate-slide-up overflow-hidden">
      <div className="flex gap-3 px-4 pt-4 pb-2">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="You"
              width={36}
              height={36}
              className="rounded-full object-cover w-9 h-9"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-bg-input" />
          )}
        </div>

        {/* Compose area */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            placeholder="What's on your mind, Seawolf?"
            value={content}
            onFocus={() => setFocused(true)}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) setContent(e.target.value)
            }}
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed placeholder:text-text-muted/50 outline-none min-h-[44px]"
            rows={1}
            maxLength={MAX_CHARS}
          />
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-[12px] text-red-600">{error}</p>
        </div>
      )}

      {/* Media previews */}
      {previews.length > 0 && (
        <div className={`grid gap-1.5 mx-4 mb-3 ${previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {previews.map((p, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden">
              {p.type.startsWith('video/') ? (
                <video src={p.url} className="w-full max-h-[200px] object-cover" controls />
              ) : (
                <Image src={p.url} alt="Preview" width={400} height={300} className="w-full max-h-[200px] object-cover" />
              )}
              <button
                onClick={() => removeFile(i)}
                className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white rounded-full w-7 h-7 flex items-center justify-center press opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bottom toolbar */}
      {showExpanded && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border animate-fade-in">
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={files.length >= MAX_FILES}
              className="text-text-muted hover:text-text transition-colors press disabled:opacity-30 p-1 -m-1"
            >
              <ImagePlus size={20} strokeWidth={1.5} />
            </button>
            {files.length > 0 && (
              <span className="text-[11px] text-text-muted font-medium">{files.length}/{MAX_FILES}</span>
            )}
            {content.length > 0 && (
              <span className={`text-[11px] font-medium ${charsLeft < 200 ? 'text-red-500' : 'text-text-muted/50'}`}>
                {charsLeft}
              </span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFilesSelect}
            className="hidden"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !hasContent || content.length > MAX_CHARS}
            className="bg-accent text-white px-5 py-1.5 rounded-full text-[13px] font-bold press disabled:opacity-30 transition-opacity min-w-[64px] flex items-center justify-center"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'Post'}
          </button>
        </div>
      )}
    </div>
  )
}
