'use client'

import { motion } from 'framer-motion'

interface FlameStreakProps {
  days: number
}

export default function FlameStreak({ days }: FlameStreakProps) {
  const getFlameEmoji = () => {
    if (days >= 100) return '✨🔥'
    if (days >= 30) return '🔥🔥'
    if (days >= 7) return '🔥'
    return '🕯️'
  }

  const getMessage = () => {
    if (days === 0) return "Start your journey today 🌱"
    if (days < 7) return "Keep going at your pace 💙"
    if (days < 30) return "Beautiful discipline 🌿"
    if (days < 100) return "You're becoming a legend ✨"
    return "Eternal flame achieved! 🏆"
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-beige-50 to-white">
      <motion.div
        className="text-5xl"
        animate={{
          scale: [1, 1.05, 1],
          rotate: [-2, 2, -2]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {getFlameEmoji()}
      </motion.div>
      
      <div className="flex-1">
        <div className="text-2xl font-semibold text-slate-700">
          {days} {days === 1 ? 'day' : 'days'}
        </div>
        <div className="text-sm text-slate-500">
          {getMessage()}
        </div>
      </div>
    </div>
  )
}