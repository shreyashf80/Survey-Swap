'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Lock, Unlock, Copy, Check } from 'lucide-react'

export function RecoveryCodeVault({ 
  code, 
  savedCode, 
  setSavedCode 
}: { 
  code: string, 
  savedCode: boolean, 
  setSavedCode: (v: boolean) => void 
}) {
  const [displayedCode, setDisplayedCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [isSealed, setIsSealed] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  // Typewriter effect
  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayedCode(code)
      return
    }
    let i = 0
    const timer = setInterval(() => {
      setDisplayedCode(code.slice(0, i + 1))
      i++
      if (i === code.length) clearInterval(timer)
    }, 30) // 30ms per char
    return () => clearInterval(timer)
  }, [code, shouldReduceMotion])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSeal = (checked: boolean) => {
    setSavedCode(checked)
    setIsSealed(checked)
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 relative overflow-hidden">
      {/* Vault Door Overlay Animation */}
      <AnimatePresence>
        {isSealed && (
          <motion.div 
            initial={{ x: shouldReduceMotion ? 0 : '100%', opacity: shouldReduceMotion ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: shouldReduceMotion ? 0 : '100%', opacity: shouldReduceMotion ? 0 : 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', damping: 20, stiffness: 100 }}
            className="absolute inset-0 bg-indigo-900 z-10 flex items-center justify-center border-l-8 border-indigo-700"
          >
            <div className="text-center">
              <Lock className="w-12 h-12 text-indigo-300 mx-auto mb-2" />
              <p className="text-indigo-200 font-bold tracking-widest uppercase">Vault Sealed</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400">
        <Unlock className="w-6 h-6" />
        <h3 className="text-lg font-bold">Your Recovery Code</h3>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        We don't ask for your email. This code is the <strong>only way</strong> to recover your account if you forget your password. Write it down or save it in a password manager.
      </p>

      <div className="flex items-stretch gap-2 mb-6">
        <div className="flex-1 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 flex items-center justify-center font-mono text-xl tracking-[0.2em] font-bold text-gray-900 dark:text-gray-100 min-h-[4rem]">
          {displayedCode}
          <span className="w-2 h-6 bg-indigo-500 ml-1 motion-safe:animate-pulse" style={{ opacity: displayedCode.length === code.length ? 0 : 1 }}></span>
        </div>
        <button
          type="button"
          onClick={copyToClipboard}
          className="px-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
          title="Copy Code"
        >
          {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
        </button>
      </div>

      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <input
          id="saved-code"
          type="checkbox"
          required
          checked={savedCode}
          onChange={(e) => handleSeal(e.target.checked)}
          className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
        />
        <label htmlFor="saved-code" className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer select-none">
          I have securely saved this recovery code
        </label>
      </div>
    </div>
  )
}
