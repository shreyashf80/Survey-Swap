'use client'

import { useState } from 'react'
import { cancelSurvey } from '@/app/actions/surveys'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Moon, Activity } from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE') {
    return (
      <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800/30">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-2 h-2 rounded-full bg-green-500"
        />
        <span className="text-xs font-bold text-green-700 dark:text-green-400">ACTIVE</span>
      </div>
    )
  }
  
  if (status === 'PAUSED') {
    return (
      <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Moon className="w-3 h-3 text-gray-500" />
          <motion.span
            animate={{ opacity: [0, 1, 0], y: [0, -4, -8], x: [0, 2, 4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute -top-1 -right-2 text-[8px] font-bold text-gray-400"
          >
            z
          </motion.span>
        </div>
        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">PAUSED</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800/30">
      <CheckCircle2 className="w-3 h-3 text-indigo-500" />
      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">COMPLETED</span>
    </div>
  )
}

export function ActiveSurveyCard({ survey }: { survey: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this survey? You will not get refunds for filled responses, but unspent credits remain in your balance.')) return
    
    setLoading(true)
    setError('')
    const res = await cancelSurvey(survey.id)
    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      router.refresh()
    }
  }

  const progress = survey.current_responses / survey.target_responses
  const dashArray = 2 * Math.PI * 36 // r=36
  const dashOffset = dashArray * (1 - progress)

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Your Active Survey</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate max-w-md">
            {survey.google_form_url}
          </p>
        </div>
        <StatusBadge status={survey.status} />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex items-center space-x-8 mb-8">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" className="stroke-gray-100 dark:stroke-gray-700" strokeWidth="6" fill="none" />
            <motion.circle 
              cx="40" cy="40" r="36" 
              className="stroke-indigo-500" 
              strokeWidth="6" 
              strokeLinecap="round"
              fill="none" 
              strokeDasharray={dashArray}
              initial={{ strokeDashoffset: dashArray }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{survey.current_responses}</span>
            <span className="text-xs text-gray-500 uppercase font-medium mt-1">/ {survey.target_responses}</span>
          </div>
        </div>

        <div className="flex-grow">
          {survey.status === 'PAUSED' ? (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800/30 text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Paused!</strong> You ran out of credits. Earn more credits by filling out other surveys in the feed, and this survey will automatically resume.
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Responses flowing in...</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Your survey is live in the feed. Each response costs 1 credit.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Cancelling...' : 'Cancel Survey'}
        </button>
      </div>
    </div>
  )
}
