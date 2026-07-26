'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import clsx from 'clsx'

type User = {
  id: string
  username: string
  total_forms_filled: number
}

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

function Avatar({ name, size = 'md' }: { name: string, size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-xl'
  }
  return (
    <div className={clsx("rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-inner", sizes[size])}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

export function Leaderboard({ topUsers, currentUser, currentUserRank }: { topUsers: User[], currentUser: User, currentUserRank: number }) {
  const prevRank = usePrevious(currentUserRank)
  const [highlight, setHighlight] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (prevRank !== undefined && currentUserRank < prevRank) {
      setHighlight(true)
      setTimeout(() => setHighlight(false), 2000)
    }
  }, [currentUserRank, prevRank])

  const user1 = topUsers[0]
  const user2 = topUsers[1]
  const user3 = topUsers[2]
  const listUsers = topUsers.slice(3)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      
      {/* Podium */}
      <div className="pt-12 pb-8 px-2 sm:px-6 bg-gradient-to-b from-indigo-50/50 to-white dark:from-indigo-900/10 dark:to-gray-800 flex justify-center items-end space-x-2 sm:space-x-4 h-64 border-b border-gray-100 dark:border-gray-700">
        
        {/* Rank 2 */}
        {user2 && (
          <div className="flex flex-col items-center w-24">
            <motion.div animate={shouldReduceMotion ? {} : { y: [0, -2, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}>
              <Avatar name={user2.username} size="md" />
            </motion.div>
            <div className="mt-3 bg-gray-200 dark:bg-gray-700 w-full h-24 rounded-t-lg flex flex-col items-center justify-start pt-2 border-t-4 border-gray-300 dark:border-gray-500 shadow-inner">
              <span className="text-xl font-bold text-gray-500 dark:text-gray-400">2</span>
              <span className="text-xs font-medium text-gray-900 dark:text-white truncate w-full px-2 text-center mt-1">{user2.username}</span>
              <span className="text-[10px] text-gray-500">{user2.total_forms_filled} pts</span>
            </div>
          </div>
        )}

        {/* Rank 1 */}
        {user1 && (
          <div className="flex flex-col items-center w-28">
            <motion.div animate={shouldReduceMotion ? {} : { y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl">👑</div>
              <Avatar name={user1.username} size="lg" />
            </motion.div>
            <div className="mt-3 bg-gradient-to-t from-yellow-400 to-yellow-300 dark:from-yellow-600 dark:to-yellow-500 w-full h-32 rounded-t-lg flex flex-col items-center justify-start pt-2 border-t-4 border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.3)]">
              <span className="text-2xl font-black text-yellow-800 dark:text-yellow-100">1</span>
              <span className="text-sm font-bold text-yellow-900 dark:text-yellow-50 truncate w-full px-2 text-center mt-1">{user1.username}</span>
              <span className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">{user1.total_forms_filled} pts</span>
            </div>
          </div>
        )}

        {/* Rank 3 */}
        {user3 && (
          <div className="flex flex-col items-center w-24">
            <motion.div animate={shouldReduceMotion ? {} : { y: [0, -2, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
              <Avatar name={user3.username} size="sm" />
            </motion.div>
            <div className="mt-3 bg-orange-200 dark:bg-orange-900/50 w-full h-20 rounded-t-lg flex flex-col items-center justify-start pt-2 border-t-4 border-orange-300 dark:border-orange-800 shadow-inner">
              <span className="text-lg font-bold text-orange-700 dark:text-orange-400">3</span>
              <span className="text-xs font-medium text-gray-900 dark:text-white truncate w-full px-2 text-center mt-1">{user3.username}</span>
              <span className="text-[10px] text-gray-500">{user3.total_forms_filled} pts</span>
            </div>
          </div>
        )}
      </div>

      {/* List for Rank 4-5 */}
      <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
        {listUsers.map((user, index) => {
          const rank = index + 4
          const isMe = user.id === currentUser.id
          return (
            <motion.li 
              key={user.id} 
              layout
              className={clsx(
                "px-6 py-4 flex items-center justify-between transition-colors",
                isMe ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""
              )}
            >
              <div className="flex items-center space-x-4">
                <span className="w-6 text-center font-bold text-gray-400">#{rank}</span>
                <Avatar name={user.username} size="sm" />
                <span className={clsx("font-medium", isMe ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-gray-900 dark:text-white")}>
                  {user.username} {isMe && "(You)"}
                </span>
              </div>
              <span className="font-semibold text-gray-600 dark:text-gray-300">{user.total_forms_filled} pts</span>
            </motion.li>
          )
        })}
      </ul>

      {/* Pinned row if outside top 5 */}
      {currentUserRank > 5 && (
        <motion.div 
          animate={highlight && !shouldReduceMotion ? { backgroundColor: ['rgba(238,242,255,1)', 'rgba(79,70,229,0.1)', 'rgba(238,242,255,1)'] } : {}}
          className="border-t-2 border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/80 dark:bg-indigo-900/20 px-6 py-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <span className="w-6 text-center font-bold text-indigo-400 dark:text-indigo-500">#{currentUserRank}</span>
            <Avatar name={currentUser.username} size="sm" />
            <span className="font-bold text-indigo-700 dark:text-indigo-300">
              You
            </span>
          </div>
          <span className="font-bold text-indigo-700 dark:text-indigo-300">{currentUser.total_forms_filled} pts</span>
        </motion.div>
      )}
    </div>
  )
}
