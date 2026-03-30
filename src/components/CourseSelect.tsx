'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { getMatchingDepts, getCoursesForDept, searchCourses } from '@/lib/sbu-data'

interface CourseSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function CourseSelect({ value, onChange, className }: CourseSelectProps) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [deptMatches, setDeptMatches] = useState<{ code: string; name: string }[]>([])
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [deptCourses, setDeptCourses] = useState<string[]>([])
  const [courseFilter, setCourseFilter] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const courseInputRef = useRef<HTMLInputElement>(null)

  const courses = value ? value.split(', ').filter(Boolean) : []

  // When in prefix-search mode
  useEffect(() => {
    if (!selectedDept && input.length >= 1) {
      // Try direct course search first (e.g. "CSE 3")
      const directResults = searchCourses(input).filter(s => !courses.includes(s))
      if (directResults.length > 0) {
        setSuggestions(directResults)
        setDeptMatches([])
      } else {
        setDeptMatches(getMatchingDepts(input))
        setSuggestions([])
      }
    } else if (!selectedDept) {
      setDeptMatches([])
      setSuggestions([])
    }
  }, [input, selectedDept, courses])

  // When a dept is selected, load its courses
  useEffect(() => {
    if (selectedDept) {
      const all = getCoursesForDept(selectedDept).filter(c => !courses.includes(c))
      setDeptCourses(all)
    }
  }, [selectedDept, courses])

  // Filter dept courses
  const filteredDeptCourses = courseFilter
    ? deptCourses.filter(c => c.includes(courseFilter.toUpperCase()))
    : deptCourses

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectDept = (code: string) => {
    setSelectedDept(code)
    setInput('')
    setCourseFilter('')
    setDeptMatches([])
    setSuggestions([])
    setTimeout(() => courseInputRef.current?.focus(), 0)
  }

  const addCourse = (course: string) => {
    if (courses.includes(course)) return
    const updated = [...courses, course].join(', ')
    onChange(updated)
    setCourseFilter('')
  }

  const removeCourse = (course: string) => {
    const updated = courses.filter((c) => c !== course).join(', ')
    onChange(updated)
  }

  const cancelDept = () => {
    setSelectedDept(null)
    setCourseFilter('')
    setDeptCourses([])
  }

  return (
    <div ref={ref} className="relative">
      {courses.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {courses.map((course) => (
            <span key={course} className="inline-flex items-center gap-1 bg-bg-input text-[12px] font-medium px-2.5 py-1 rounded-full">
              {course}
              <button type="button" onClick={() => removeCourse(course)} className="text-text-muted hover:text-text">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {selectedDept ? (
        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="inline-flex items-center gap-1 bg-accent text-white text-[13px] font-semibold px-2.5 py-1.5 rounded-lg">
              {selectedDept}
              <button type="button" onClick={cancelDept}><X size={12} /></button>
            </span>
            <input
              ref={courseInputRef}
              type="text"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              placeholder="Filter courses..."
              className={className}
            />
          </div>
          <div className="bg-bg-card border border-border rounded-xl max-h-[200px] overflow-y-auto">
            {filteredDeptCourses.map((course) => (
              <button
                key={course}
                type="button"
                onClick={() => addCourse(course)}
                className="w-full text-left px-4 py-2 text-[13px] hover:bg-bg-card-hover transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                {course}
              </button>
            ))}
            {filteredDeptCourses.length === 0 && (
              <p className="px-4 py-2 text-[13px] text-text-muted">No matching courses</p>
            )}
          </div>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Search department (e.g. CSE, Math, Bio...)"
            className={className}
          />
          {open && (deptMatches.length > 0 || suggestions.length > 0) && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-xl shadow-lg max-h-[200px] overflow-y-auto">
              {deptMatches.map(({ code, name }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => selectDept(code)}
                  className="w-full text-left px-4 py-2 text-[13px] hover:bg-bg-card-hover transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  <span className="font-semibold">{code}</span>
                  <span className="text-text-muted ml-2">{name}</span>
                </button>
              ))}
              {suggestions.map((course) => (
                <button
                  key={course}
                  type="button"
                  onClick={() => { addCourse(course); setInput(''); setOpen(false) }}
                  className="w-full text-left px-4 py-2 text-[13px] hover:bg-bg-card-hover transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  {course}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
