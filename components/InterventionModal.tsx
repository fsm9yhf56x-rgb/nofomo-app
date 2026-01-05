'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface InterventionModalProps {
  show: boolean
  demonType: string
  context: string
  onAccept: () => void
  onDismiss: () => void
}

export default function InterventionModal({ 
  show, 
  demonType, 
  context, 
  onAccept, 
  onDismiss 
}: InterventionModalProps) {
  
  const getMessages = () => {
    const messages: any = {
      impatience: {
        emoji: '💙',
        title: 'Take a breath, Knight',
        description: context,
        suggestion: 'Your rules need time to work. Changing them too quickly reduces their effectiveness.',
        actions: [
          { label: 'Lock rules for 2h', action: 'lock_2h' },
          { label: 'Write in journal', action: 'journal' }
        ]
      },
      fomo: {
        emoji: '🌿',
        title: 'FOMO is whispering',
        description: context,
        suggestion: 'Missing out feels urgent, but discipline feels better tomorrow.',
        actions: [
          { label: 'Enable Zen Mode', action: 'zen_mode' },
          { label: 'Review my goals', action: 'goals' }
        ]
      },
      greed: {
        emoji: '💰',
        title: 'Greed wants more',
        description: context,
        suggestion: 'Protecting gains is winning. Don\'t let greed steal your victory.',
        actions: [
          { label: 'Keep current TP', action: 'keep_tp' },
          { label: 'Review my strategy', action: 'strategy' }
        ]
      }
    }
    return messages[demonType] || messages.impatience
  }

  const msg = getMessages()

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="zen-card max-w-md w-full p-8 space-y-6"
          >
            {/* Header */}
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                {msg.emoji}
              </motion.div>
              <h3 className="text-2xl font-semibold text-slate-700 mb-2">
                {msg.title}
              </h3>
              <p className="text-amber-600 text-sm">
                {msg.description}
              </p>
            </div>

            {/* Suggestion */}
            <div className="bg-beige-50 rounded-lg p-4">
              <p className="text-sm text-slate-600">
                {msg.suggestion}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={onAccept}
                className="w-full btn-zen py-3"
              >
                Keep my protection 🛡️
              </button>
              
              <button
                onClick={onDismiss}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm"
              >
                I understand, continue anyway
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}