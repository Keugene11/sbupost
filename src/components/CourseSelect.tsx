'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { generateCourseSuggestions, SBU_COURSE_PREFIXES } from '@/lib/sbu-data'

interface CourseSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function CourseSelect({ value, onChange, className }: CourseSelectProps) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const ref = useRef<HTMLDivElement>(null)

  const courses = value ? value.split(', ').filter(Boolean) : []

  useEffect(() => {
    if (input.trim().length < 2) {
      setSuggestions([])
      return
    }
    const results = generateCourseSuggestions(input).filter((s) => !courses.includes(s))
    setSuggestions(results.slice(0, 10))
  }, [input, courses])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const addCourse = (course: string) => {
    const upper = course.toUpperCase().trim()
    if (!upper || courses.includes(upper)) return
    const updated = [...courses, upper].join(', ')
    onChange(updated)
    setInput('')
    setSuggestions([])
  }

  const removeCourse = (course: string) => {
    const updated = courses.filter((c) => c !== course).join(', ')
    onChange(updated)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Only allow selecting from suggestions
      if (suggestions.length > 0) {
        addCourse(suggestions[0])
      }
    }
  }

  return (
    <div ref={ref} className="relative">
      {courses.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {courses.map((course) => (
            <span
              key={course}
              className="inline-flex items-center gap-1 bg-bg-input text-[12px] font-medium px-2.5 py-1 rounded-full"
            >
              {course}
              <button
                type="button"
                onClick={() => removeCourse(course)}
                className="text-text-muted hover:text-text"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Type course prefix (e.g. CSE, AMS, BIO...)"
        className={className}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-xl shadow-lg max-h-[200px] overflow-y-auto">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => addCourse(item)}
              className="w-full text-left px-4 py-2 text-[13px] hover:bg-bg-card-hover transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
