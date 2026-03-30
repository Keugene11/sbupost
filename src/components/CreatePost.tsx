'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function CreatePost({ onPostCreated }: { onPostCreated: () => void }) {
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let imageUrl: string | null = null

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, imageFile)

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      }
    }

    await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim(),
      image_url: imageUrl,
    })

    setContent('')
    removeImage()
    setLoading(false)
    onPostCreated()
  }

  return (
    <div className="bg-bg-card border border-border rounded-2xl px-4 py-4 mb-4 animate-slide-up">
      <textarea
        placeholder="What's on your mind, Seawolf?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full resize-none bg-transparent text-[14px] placeholder:text-text-muted/50 outline-none min-h-[60px]"
        rows={2}
      />
      {imagePreview && (
        <div className="relative mt-2 mb-2">
          <Image
            src={imagePreview}
            alt="Preview"
            width={400}
            height={300}
            className="rounded-xl w-full max-h-[200px] object-cover"
          />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 press"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          onClick={() => fileRef.current?.click()}
          className="text-text-muted hover:text-text transition-colors press"
        >
          <ImagePlus size={20} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || (!content.trim() && !imageFile)}
          className="bg-accent text-white px-5 py-1.5 rounded-full text-[13px] font-semibold press disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'Post'}
        </button>
      </div>
    </div>
  )
}
