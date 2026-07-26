'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { checkUsername } from '@/app/actions/auth'
import { Check, X, Loader2 } from 'lucide-react'

export function UsernameField({ username, setUsername }: { username: string, setUsername: (v: string) => void }) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (username.length < 3) {
      setStatus('idle')
      return
    }

    setStatus('checking')
    const timer = setTimeout(async () => {
      const res = await checkUsername(username)
      setStatus(res.available ? 'available' : 'taken')
    }, 400) // 400ms debounce

    return () => clearTimeout(timer)
  }, [username])

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
      <div className="relative mt-1">
        <input
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          className="block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm pr-10"
          placeholder="your_username"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <AnimatePresence mode="wait">
            {status === 'checking' && (
              <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              </motion.div>
            )}
            {status === 'available' && (
              <motion.div 
                key="available" 
                initial={{ scale: shouldReduceMotion ? 1 : 0, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: shouldReduceMotion ? 1 : 0, opacity: 0 }}
                transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Check className="w-5 h-5 text-green-500" />
              </motion.div>
            )}
            {status === 'taken' && (
              <motion.div 
                key="taken" 
                initial={{ scale: shouldReduceMotion ? 1 : 0, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: shouldReduceMotion ? 1 : 0, opacity: 0 }}
                transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 30 }}
              >
                <X className="w-5 h-5 text-red-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {status === 'taken' && <p className="text-xs text-red-500 mt-1">Username is taken</p>}
      {status === 'available' && <p className="text-xs text-green-500 mt-1">Username is available!</p>}
    </div>
  )
}
