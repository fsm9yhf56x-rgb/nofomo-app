'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EditRuleModal from './EditRuleModal'

interface Protection {
  id: string
  token_pair: string
  action_type: string
  trigger_price: number
  sell_percentage: number
  is_active: boolean
  created_at: string
  wallet_address: string
}

interface ProtectionCardProps {
  protection: Protection
  onDisable: (id: string) => void
}

export default function ProtectionCard({ protection, onDisable }: ProtectionCardProps) {
  const isProfit = protection.action_type === 'take_profit'
  const [showConfirm, setShowConfirm] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  
  // Calculate days active
  const daysActive = Math.floor(
    (Date.now() - new Date(protection.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  const handleDisable = () => {
    setShowConfirm(true)
  }
  
  const confirmDisable = () => {
    onDisable(protection.id)
    setShowConfirm(false)
  }

  const handleEdit = () => {
    setShowEdit(true)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="zen-card p-6 space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">
              {isProfit ? '📈' : '🛡️'}
            </div>
            <div>
              <div className="font-semibold text-slate-700">
                {protection.token_pair}
              </div>
              <div className="text-xs text-slate-500 normal-case tracking-normal">
                {isProfit ? 'Take Profit' : 'Stop Loss'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {protection.is_active && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-sage-400 rounded-full"
              />
            )}
            <span className="text-sm text-slate-600">
              {daysActive} {daysActive === 1 ? 'day' : 'days'} 🌱
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <div className="text-xs text-slate-500">TRIGGER PRICE</div>
            <div className="text-lg font-semibold text-slate-700">
              ${protection.trigger_price.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">SELL AMOUNT</div>
            <div className="text-lg font-semibold text-slate-700">
              {protection.sell_percentage}%
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-sage-600 flex items-center gap-2">
            <span>✓</span>
            <span className="normal-case tracking-normal">Active and watching</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleEdit}
              className="text-xs text-slate-400 hover:text-sage-600 transition-colors"
            >
              EDIT
            </button>
            <button 
              onClick={handleDisable}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              DISABLE
            </button>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="zen-card max-w-md p-8 space-y-6 m-4"
            >
              <div className="text-center">
                <div className="text-5xl mb-4">💙</div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  PAUSE A MOMENT
                </h3>
                <p className="text-slate-600 text-sm normal-case tracking-normal">
                  Your protection has been watching for {daysActive} {daysActive === 1 ? 'day' : 'days'}.
                </p>
                {daysActive === 0 && (
                  <p className="text-amber-600 text-sm mt-2 normal-case tracking-normal">
                    💭 Disabling it so quickly might be your Impatience Demon acting up
                  </p>
                )}
                <p className="text-slate-500 text-sm mt-4 normal-case tracking-normal">
                  Are you sure you want to disable this protection?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-lg bg-sage-400 text-white font-medium hover:bg-sage-500 transition-colors"
                >
                  KEEP PROTECTION 🛡️
                </button>
                <button
                  onClick={confirmDisable}
                  className="flex-1 px-4 py-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                >
                  YES, DISABLE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      {showEdit && (
        <EditRuleModal
          show={showEdit}
          protection={protection}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setShowEdit(false)
            // Reload will be triggered by parent
          }}
          walletAddress={protection.wallet_address}
        />
      )}
    </>
  )
}