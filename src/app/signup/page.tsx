'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp } from '../actions/auth'

import { UsernameField } from '@/components/auth/UsernameField'
import { RecoveryCodeVault } from '@/components/auth/RecoveryCodeVault'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Coins } from 'lucide-react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function SignUpPage() {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [savedCode, setSavedCode] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const generateCode = () => {
    // Generate a random 16-char code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let code = ''
    for (let i = 0; i < 16; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setRecoveryCode(code)
    setStep(2)
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim().length === 0) {
      setError('Display name is required')
      return
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setError('')
    generateCode()
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!savedCode) {
      setError('You must confirm you have saved the recovery code')
      return
    }
    setLoading(true)
    setError('')
    
    const res = await signUp(username, name, password, recoveryCode)
    
    if (res.error) {
      setError(res.error)
      setStep(1) // Go back so they can fix username/password
      setLoading(false)
      return
    }

    // Auto login
    const loginRes = await signIn('credentials', {
      redirect: false,
      username,
      password,
    })

    if (loginRes?.error) {
      setError('Account created, but failed to log in automatically.')
      setLoading(false)
    } else {
      // Trigger coin drop before redirecting
      setStep(3)
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Sign Up</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Join SurveySwap and get 1 free credit.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm text-center">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form className="mt-8 space-y-6" onSubmit={handleNext}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <UsernameField username={username} setUsername={setUsername} />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Next
              </button>
            </div>
            
            <div className="text-sm text-center">
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                Already have an account? Log in
              </Link>
            </div>
          </form>
        ) : step === 2 ? (
          <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
            <RecoveryCodeVault 
              code={recoveryCode} 
              savedCode={savedCode} 
              setSavedCode={setSavedCode} 
            />

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!savedCode || loading}
                className="w-2/3 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Complete Sign Up'}
              </button>
            </div>
          </form>
        ) : step === 3 ? (
          <div className="mt-8 flex flex-col items-center justify-center min-h-[300px] relative">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Welcome aboard!</h3>
            
            <div className="relative w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center border-4 border-indigo-500 shadow-xl overflow-hidden">
              <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 z-10">+1</span>
              <AnimatePresence>
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    initial={{ y: shouldReduceMotion ? 0 : -150, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={shouldReduceMotion ? { duration: 0 } : {
                      type: 'spring',
                      stiffness: 200,
                      damping: 12,
                      delay: i * 0.15,
                    }}
                    className="absolute inset-0 flex items-center justify-center z-0 text-yellow-400 drop-shadow-md"
                  >
                    <Coins className="w-16 h-16" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <p className="mt-6 text-gray-500 dark:text-gray-400 motion-safe:animate-pulse">
              Entering dashboard...
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
