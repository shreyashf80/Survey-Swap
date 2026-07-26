'use client'

import React, { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'

export function AnimatedCounter({ value }: { value: number }) {
  const [localValue, setLocalValue] = useState(value)
  const shouldReduceMotion = useReducedMotion()
  
  const motionValue = useMotionValue(localValue)
  const springValue = useSpring(motionValue, {
    damping: 15,
    stiffness: 100,
    duration: shouldReduceMotion ? 0.01 : undefined
  })
  
  const displayValue = useTransform(springValue, (latest) => Math.round(latest))

  useEffect(() => {
    if (shouldReduceMotion) {
      setLocalValue(value)
    }
    motionValue.set(value)
  }, [value, motionValue, shouldReduceMotion])

  return (
    <motion.span
      id="credit-balance-display"
      key={value}
      initial={{ scale: 1 }}
      animate={{ scale: shouldReduceMotion ? 1 : [1, 1.25, 1] }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
      className="text-lg font-bold text-indigo-700 dark:text-indigo-300 inline-block min-w-[20px] text-center"
    >
      <motion.span>{shouldReduceMotion ? value : displayValue}</motion.span>
    </motion.span>
  )
}
