'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImagePlus, X, Loader2, Video } from 'lucide-react'
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
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = useRef(createClient()).current

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
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!content.trim() && files.length === 0) return
    if (content.length > MAX_CHARS) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

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
    onPostCreated()
  }

  const charsLeft = MAX_CHARS - content.length

  return (
    <div className="bg-bg-card border border-border rounded-2xl px-4 py-4 mb-4 animate-slide-up">
      <textarea
        placeholder="What's on your mind, Seawolf?"
        value={content}
        onChange={(e) => {
          if (e.target.value.length <= MAX_CHARS) setContent(e.target.value)
        }}
        className="w-full resize-none bg-transparent text-[14px] placeholder:text-text-muted/50 outline-none min-h-[60px]"
        rows={2}
        maxLength={MAX_CHARS}
      />
      {error && (
        <p className="text-[12px] text-red-500 mb-1">{error}</p>
      )}
      {content.length > 0 && (
        <p className={`text-[11px] text-right ${charsLeft < 200 ? 'text-accent' : 'text-text-muted'}`}>
          {charsLeft}
        </p>
      )}
      {previews.length > 0 && (
        <div className={`grid gap-2 mt-2 mb-2 ${previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {previews.map((p, i) => (
            <div key={i} className="relative">
              {p.type.startsWith('video/') ? (
                <video src={p.url} className="rounded-xl w-full max-h-[200px] object-cover" controls />
              ) : (
                <Image src={p.url} alt="Preview" width={400} height={300} className="rounded-xl w-full max-h-[200px] object-cover" />
              )}
              <button onClick={() => removeFile(i)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 press">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={files.length >= MAX_FILES}
            className="text-text-muted hover:text-text transition-colors press disabled:opacity-30"
          >
            <ImagePlus size={20} />
          </button>
          {files.length > 0 && (
            <span className="text-[11px] text-text-muted">{files.length}/{MAX_FILES}</span>
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
          disabled={loading || (!content.trim() && files.length === 0) || content.length > MAX_CHARS}
          className="bg-accent text-white px-5 py-1.5 rounded-full text-[13px] font-semibold press disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'Post'}
        </button>
      </div>
    </div>
  )
}
