'use client'

import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'

interface XPBarProps {
  current: number
  max: number
}

export default function XPBar({ current, max }: XPBarProps) {
  const progress = useSpring(0, { 
    stiffness: 100, 
    damping: 30,
    restDelta: 0.001
  })
  
  useEffect(() => {
    progress.set((current / max) * 100)
  }, [current, max, progress])

  const percentage = Math.floor((current / max) * 100)

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-slate-600">
        <span>{current} XP</span>
        <span>{max} XP</span>
      </div>
      
      <div className="relative h-3 bg-beige-200 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ 
            width: useTransform(progress, (p) => `${p}%`),
            background: 'linear-gradient(90deg, #a8b5a0, #d4af37)'
          }}
        />
        
        {/* Sparkle at the end */}
        <motion.div
          className="absolute inset-y-0 text-xs flex items-center"
          style={{ 
            left: useTransform(progress, (p) => `${p}%`),
          }}
        >
          ✨
        </motion.div>
      </div>
      
      <div className="text-xs text-center text-slate-500">
        {max - current} XP to next level
      </div>
    </div>
  )
}
