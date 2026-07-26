'use client'

import { useState, useRef } from 'react'
import { confirmFill } from '@/app/actions/credits'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useReward } from './RewardProvider'
import { toast } from 'react-toastify'
import clsx from 'clsx'
import { CheckCircle2 } from 'lucide-react'

export function FillSurveyCard({ survey, fillerId }: { survey: any, fillerId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isFlipped, setIsFlipped] = useState(false)
  const [isMilestone, setIsMilestone] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { triggerReward } = useReward()
  const shouldReduceMotion = useReducedMotion()

  const handleOpen = () => {
    setIsFlipped(true)
    window.open(survey.google_form_url, '_blank')
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    
    if (buttonRef.current && !shouldReduceMotion) {
      const rect = buttonRef.current.getBoundingClientRect()
      const x = (rect.left + rect.width / 2) / window.innerWidth
      const y = (rect.top + rect.height / 2) / window.innerHeight
      confetti({
        particleCount: 20,
        spread: 60,
        origin: { x, y },
        colors: ['#4f46e5', '#fbbf24', '#22c55e']
      })
      triggerReward(rect)
    }

    const res = await confirmFill(survey.id, fillerId)
    
    if (res.error) {
      setError(res.error)
      setLoading(false)
      setTimeout(() => router.refresh(), 2000)
    } else {
      toast.success('🪙 +1 credit earned!')
      if (survey.current_responses + 1 >= survey.target_responses) {
        setIsMilestone(true)
        setTimeout(() => router.refresh(), 2500)
      } else {
        setTimeout(() => router.refresh(), 800)
      }
    }
  }

  const progress = survey.current_responses / survey.target_responses
  const dashArray = 2 * Math.PI * 24 // r=24
  const dashOffset = dashArray * (1 - progress)
  const isUrgent = survey.target_responses - survey.current_responses <= 3

  if (isMilestone) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-[300px] w-full bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800/30 flex flex-col items-center justify-center text-center space-y-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10, stiffness: 100, delay: shouldReduceMotion ? 0 : 0.2, duration: shouldReduceMotion ? 0 : undefined }}
        >
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        </motion.div>
        <div>
          <h3 className="text-xl font-bold text-green-800 dark:text-green-300">Survey Complete!</h3>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            You were the last one needed! Great job.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="relative h-[300px]" style={{ perspective: '1000px' }}>
      <motion.div
        className={clsx("w-full h-full motion-safe:transition-shadow motion-safe:duration-500", isUrgent && !isFlipped && "shadow-[0_0_15px_rgba(245,158,11,0.5)]")}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: "easeInOut" }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Face */}
        <div className="absolute inset-0 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between" style={{ backfaceVisibility: 'hidden' }}>
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[150px]" title={survey.owner?.name || survey.owner?.username}>
                {survey.owner?.name || survey.owner?.username || `Survey #${survey.id.slice(0, 4)}`}
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                #{survey.id.slice(0, 6)}
              </span>
            </div>
            <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 rounded text-xs font-bold">
              +1 Credit
            </span>
          </div>
          
          <div className="flex flex-col items-center justify-center flex-grow py-4">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" className="stroke-gray-100 dark:stroke-gray-700" strokeWidth="6" fill="none" />
                <motion.circle 
                  cx="28" cy="28" r="24" 
                  className="stroke-indigo-500" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  fill="none" 
                  strokeDasharray={dashArray}
                  initial={{ strokeDashoffset: dashArray }}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: shouldReduceMotion ? 0 : 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-xl font-bold text-gray-900 dark:text-white">{survey.current_responses}</span>
                <span className="text-[10px] text-gray-500 uppercase leading-none mt-1">/ {survey.target_responses}</span>
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleOpen}
            className="w-full py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Open Form
          </motion.button>
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Did you finish?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Only confirm if you actually submitted the Google Form. Fake fills may result in an account ban.
            </p>
            {error && (
              <div className="mt-3 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200">
                {error}
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <motion.button
              ref={buttonRef}
              whileTap={{ scale: 0.95 }}
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 focus:outline-none"
            >
              {loading ? 'Claiming...' : 'I completed it!'}
            </motion.button>
            <button
              onClick={() => setIsFlipped(false)}
              disabled={loading}
              className="w-full py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
