'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

interface AutocompleteProps {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  placeholder?: string
  className?: string
}

export default function Autocomplete({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
}: AutocompleteProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [filtered, setFiltered] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (query.trim().length < 1) {
      setFiltered(suggestions)
      return
    }
    const q = query.toLowerCase()
    setFiltered(suggestions.filter((s) => s.toLowerCase().includes(q)))
  }, [query, suggestions])

  if (value) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 bg-bg-input text-[13px] font-medium px-3 py-2 rounded-xl">
          {value}
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-text-muted hover:text-text"
          >
            <X size={14} />
          </button>
        </span>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={className}
      />
      {open && filtered.length > 0 && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-xl shadow-lg max-h-[200px] overflow-y-auto">
            {filtered.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  onChange(item)
                  setQuery('')
                  setOpen(false)
                }}
                className="w-full text-left px-4 py-2 text-[13px] hover:bg-bg-card-hover transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                {item}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
