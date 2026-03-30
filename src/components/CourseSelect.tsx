'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { getMatchingPrefixes, isValidCoursePrefix } from '@/lib/sbu-data'

interface CourseSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function CourseSelect({ value, onChange, className }: CourseSelectProps) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const [prefixMatches, setPrefixMatches] = useState<{ code: string; name: string }[]>([])
  const [selectedPrefix, setSelectedPrefix] = useState<string | null>(null)
  const [courseNumber, setCourseNumber] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const numberRef = useRef<HTMLInputElement>(null)

  const courses = value ? value.split(', ').filter(Boolean) : []

  useEffect(() => {
    if (!selectedPrefix && input.length >= 1) {
      setPrefixMatches(getMatchingPrefixes(input))
    } else {
      setPrefixMatches([])
    }
  }, [input, selectedPrefix])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectPrefix = (code: string) => {
    setSelectedPrefix(code)
    setInput('')
    setPrefixMatches([])
    setCourseNumber('')
    setTimeout(() => numberRef.current?.focus(), 0)
  }

  const addCourse = () => {
    if (!selectedPrefix || !courseNumber.match(/^\d{3}$/)) return
    const course = `${selectedPrefix} ${courseNumber}`
    if (courses.includes(course)) return
    const updated = [...courses, course].join(', ')
    onChange(updated)
    setSelectedPrefix(null)
    setCourseNumber('')
    setInput('')
  }

  const removeCourse = (course: string) => {
    const updated = courses.filter((c) => c !== course).join(', ')
    onChange(updated)
  }

  const handleNumberKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCourse()
    }
    if (e.key === 'Backspace' && courseNumber === '') {
      setSelectedPrefix(null)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Check if typed text is a valid prefix
      const upper = input.toUpperCase().trim()
      if (isValidCoursePrefix(upper)) {
        selectPrefix(upper)
      } else if (prefixMatches.length > 0) {
        selectPrefix(prefixMatches[0].code)
      }
    }
  }

  const cancelPrefix = () => {
    setSelectedPrefix(null)
    setCourseNumber('')
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
              <button type="button" onClick={() => removeCourse(course)} className="text-text-muted hover:text-text">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {selectedPrefix ? (
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1 bg-accent text-white text-[13px] font-semibold px-2.5 py-1.5 rounded-lg">
            {selectedPrefix}
            <button type="button" onClick={cancelPrefix}>
              <X size={12} />
            </button>
          </span>
          <input
            ref={numberRef}
            type="text"
            inputMode="numeric"
            maxLength={3}
            value={courseNumber}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '')
              setCourseNumber(v)
            }}
            onKeyDown={handleNumberKeyDown}
            placeholder="Course # (e.g. 320)"
            className={className}
          />
          {courseNumber.match(/^\d{3}$/) && (
            <button
              type="button"
              onClick={addCourse}
              className="bg-accent text-white text-[12px] font-semibold px-3 py-2 rounded-xl press shrink-0"
            >
              Add
            </button>
          )}
        </div>
      ) : (
        <>
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search department (e.g. CSE, Math, Bio...)"
            className={className}
          />
          {open && prefixMatches.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-xl shadow-lg max-h-[200px] overflow-y-auto">
              {prefixMatches.map(({ code, name }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => selectPrefix(code)}
                  className="w-full text-left px-4 py-2 text-[13px] hover:bg-bg-card-hover transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  <span className="font-semibold">{code}</span>
                  <span className="text-text-muted ml-2">{name}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
