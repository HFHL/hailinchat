'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser')
    if (currentUser) {
      router.push('/chat')
    } else {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-gray-600">Loading...</div>
    </div>
  )
}