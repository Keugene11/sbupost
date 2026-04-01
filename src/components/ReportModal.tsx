'use client'

import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { X, Flag, Check } from 'lucide-react'

const REASONS = [
  'Spam',
  'Harassment or bullying',
  'Inappropriate content',
  'Hate speech',
  'Impersonation',
  'Other',
]

interface ReportModalProps {
  type: 'post' | 'user' | 'comment'
  targetId: string
  targetUserId?: string
  onClose: () => void
}

export default function ReportModal({ type, targetId, targetUserId, onClose }: ReportModalProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = useRef(createClient()).current

  const handleSubmit = async () => {
    if (!selected) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const report: Record<string, unknown> = {
      reporter_id: user.id,
      reason: selected,
    }

    if (type === 'post') report.post_id = targetId
    if (type === 'comment') report.comment_id = targetId
    if (type === 'user' || targetUserId) report.reported_user_id = targetUserId || targetId

    await supabase.from('reports').insert(report)
    setSubmitted(true)
    setLoading(false)
    setTimeout(onClose, 1500)
  }

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center px-5" style={{ zIndex: 2147483646 }}>
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="relative bg-bg-card border border-border rounded-2xl px-6 py-6 w-full max-w-sm animate-slide-up">
        {submitted ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
              <Check size={24} className="text-green-600" />
            </div>
            <p className="font-semibold text-[16px]">Report Submitted</p>
            <p className="text-[13px] text-text-muted mt-1">We'll review this and take action if needed.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flag size={18} className="text-accent" />
                <h3 className="font-bold text-[16px]">Report {type}</h3>
              </div>
              <button onClick={onClose} className="text-text-muted press">
                <X size={20} />
              </button>
            </div>
            <p className="text-[13px] text-text-muted mb-4">Why are you reporting this {type}?</p>
            <div className="space-y-2">
              {REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelected(reason)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-[14px] transition-colors press ${
                    selected === reason
                      ? 'bg-accent/10 border border-accent/30 font-medium'
                      : 'bg-bg-input border border-transparent'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!selected || loading}
              className="w-full bg-accent text-white py-3 rounded-xl font-semibold mt-4 press disabled:opacity-40"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
