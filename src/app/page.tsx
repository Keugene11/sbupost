'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/feed')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center">
        <h1 className="text-[24px] font-extrabold tracking-tight text-text">SBUPost</h1>
      </div>
    </div>
  )
}
