'use client'

import { motion } from 'framer-motion'

interface KnightAvatarProps {
  level: number
}

export default function KnightAvatar({ level }: KnightAvatarProps) {
  // Determine knight appearance based on level
  const getKnightStyle = () => {
    if (level >= 9) return { emoji: '✨🧙‍♂️', title: 'Legend', color: '#d4af37' }
    if (level >= 7) return { emoji: '⚔️', title: 'Master', color: '#c5b9cd' }
    if (level >= 5) return { emoji: '🛡️', title: 'Guardian', color: '#6b7b8c' }
    if (level >= 3) return { emoji: '🧘‍♂️', title: 'Apprentice', color: '#a8b5a0' }
    return { emoji: '🧑', title: 'Novice', color: '#e8dcc4' }
  }

  const knight = getKnightStyle()

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="relative"
        animate={{
          scale: [1, 1.02, 1],
          y: [0, -3, 0]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Aura */}
        <motion.div
          className="absolute inset-0 rounded-full blur-xl"
          style={{ backgroundColor: knight.color }}
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [0.9, 1.1, 0.9]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Knight */}
        <div className="relative text-8xl">
          {knight.emoji}
        </div>
      </motion.div>

      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-medium text-slate-700"
        >
          Level {level} - {knight.title} Knight
        </motion.div>
      </div>
    </div>
  )
}