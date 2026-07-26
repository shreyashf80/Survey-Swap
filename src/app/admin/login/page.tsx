'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginAdmin } from '@/app/actions/adminAuth'

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    const res = await loginAdmin(formData)
    
    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-mono">
      <div className="max-w-md w-full bg-white p-8 rounded shadow-md border border-gray-300">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 uppercase tracking-wider border-b-2 border-gray-900 pb-2">
          System Admin
        </h2>
        
        {error && (
          <div className="mb-4 bg-red-100 text-red-900 p-3 rounded border border-red-300 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">USERNAME</label>
            <input
              name="username"
              type="text"
              required
              className="w-full border border-gray-400 p-2 text-gray-900 bg-gray-50 focus:border-gray-900 focus:ring-0 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">PASSWORD</label>
            <input
              name="password"
              type="password"
              required
              className="w-full border border-gray-400 p-2 text-gray-900 bg-gray-50 focus:border-gray-900 focus:ring-0 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 mt-4 disabled:bg-gray-600 transition-colors uppercase tracking-wider"
          >
            {loading ? 'Authenticating...' : 'Access Terminal'}
          </button>
        </form>
      </div>
    </div>
  )
}
