'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type User } from '@/lib/supabase'

export default function LoginPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleUserSelect(user: User) {
    localStorage.setItem('currentUser', JSON.stringify(user))
    router.push('/chat')
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Chat</h1>
          <p className="text-gray-600">Select a user to start chatting</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-3">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className="w-full flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                <div className="text-2xl">{user.avatar}</div>
                <div className="text-left">
                  <div className="font-medium text-gray-800">{user.display_name}</div>
                  <div className="text-sm text-gray-500">@{user.username}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}