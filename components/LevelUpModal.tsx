'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface LevelUpModalProps {
  show: boolean
  newLevel: number
  onClose: () => void
}

export default function LevelUpModal({ show, newLevel, onClose }: LevelUpModalProps) {
  const [particles, setParticles] = useState<number[]>([])

  useEffect(() => {
    if (show) {
      // Generate particles
      setParticles(Array.from({ length: 20 }, (_, i) => i))
      
      // Auto close after 3 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  const getKnightForLevel = () => {
    if (newLevel >= 9) return '✨🧙‍♂️'
    if (newLevel >= 7) return '⚔️'
    if (newLevel >= 5) return '🛡️'
    if (newLevel >= 3) return '🧘‍♂️'
    return '🧑'
  }

  const getTitleForLevel = () => {
    if (newLevel >= 9) return 'Legend Knight'
    if (newLevel >= 7) return 'Master Knight'
    if (newLevel >= 5) return 'Guardian Knight'
    if (newLevel >= 3) return 'Apprentice Knight'
    return 'Novice Knight'
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: -100 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="zen-card p-12 max-w-md text-center relative overflow-hidden"
          >
            {/* Particles */}
            {particles.map((i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                initial={{ 
                  x: '50%', 
                  y: '50%',
                  opacity: 1,
                  scale: 0 
                }}
                animate={{ 
                  x: `${50 + (Math.random() - 0.5) * 200}%`,
                  y: `${50 + (Math.random() - 0.5) * 200}%`,
                  opacity: 0,
                  scale: 1,
                  rotate: Math.random() * 360
                }}
                transition={{ 
                  duration: 1.5,
                  delay: i * 0.02,
                  ease: "easeOut"
                }}
              >
                {['✨', '🌟', '💫', '⭐'][Math.floor(Math.random() * 4)]}
              </motion.div>
            ))}

            {/* Content */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="relative z-10"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 0.8,
                  delay: 0.3,
                  repeat: 2
                }}
                className="text-8xl mb-4"
              >
                {getKnightForLevel()}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-3xl font-bold text-slate-700 mb-2">
                  Level {newLevel}!
                </h2>
                <p className="text-xl text-sage-600 mb-4">
                  {getTitleForLevel()}
                </p>
                <p className="text-sm text-slate-500">
                  Your discipline grows stronger 💪
                </p>
              </motion.div>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-6 h-2 bg-gradient-to-r from-sage-400 to-gold-300 rounded-full"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}