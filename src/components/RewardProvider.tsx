'use client'

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

type RewardContextType = {
  triggerReward: (rect: DOMRect) => void
  streak: number
}

const RewardContext = createContext<RewardContextType | undefined>(undefined)

export function useReward() {
  const context = useContext(RewardContext)
  if (!context) throw new Error('useReward must be used within RewardProvider')
  return context
}

export function RewardProvider({ children, initialCredits }: { children: ReactNode, initialCredits: number }) {
  const [streak, setStreak] = useState(0)
  const [coins, setCoins] = useState<{ id: number, x: number, y: number }[]>([])
  const coinIdRef = useRef(0)
  const [credits, setCredits] = useState(initialCredits)
  const [showStreakBanner, setShowStreakBanner] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  // Target ref for where coins should fly to (header credit balance)
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const el = document.getElementById('credit-balance-display')
    if (el) {
      const rect = el.getBoundingClientRect()
      setTargetPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    }
  }, [credits]) // Re-calc on render

  const triggerReward = (rect: DOMRect) => {
    if (shouldReduceMotion) {
      setCredits(prev => prev + 1)
      setStreak(s => {
        const newStreak = s + 1
        if (newStreak === 3) {
          setShowStreakBanner(true)
          setTimeout(() => setShowStreakBanner(false), 4000)
        }
        return newStreak
      })
      return
    }

    // 1. Add coin for fly animation
    const newCoin = { id: coinIdRef.current++, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    setCoins(prev => [...prev, newCoin])

    // Remove coin after animation
    setTimeout(() => {
      setCoins(prev => prev.filter(c => c.id !== newCoin.id))
      // Update credits logic after fly animation finishes (600ms)
      setCredits(prev => prev + 1)
      
      setStreak(s => {
        const newStreak = s + 1
        if (newStreak === 3) {
          setShowStreakBanner(true)
          setTimeout(() => setShowStreakBanner(false), 4000)
        }
        return newStreak
      })
    }, 600)
  }

  return (
    <RewardContext.Provider value={{ triggerReward, streak }}>
      <AnimatePresence>
        {showStreakBanner && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full shadow-lg font-bold flex items-center space-x-2"
          >
            <span>🔥</span>
            <span>On a roll! 3 surveys completed!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fly Coins */}
      {coins.map(coin => (
        <motion.div
          key={coin.id}
          initial={{ x: coin.x, y: coin.y, scale: 0.5, opacity: 1 }}
          animate={{ x: targetPos.x, y: targetPos.y, scale: 1, opacity: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed z-50 pointer-events-none text-2xl"
          style={{ marginLeft: '-12px', marginTop: '-12px' }}
        >
          🟡
        </motion.div>
      ))}

      {children}
    </RewardContext.Provider>
  )
}
