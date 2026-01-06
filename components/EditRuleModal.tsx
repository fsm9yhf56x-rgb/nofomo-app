'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'

interface EditRuleModalProps {
  show: boolean
  protection: any
  onClose: () => void
  onSuccess: () => void
  walletAddress: string
}

export default function EditRuleModal({ 
  show, 
  protection, 
  onClose, 
  onSuccess,
  walletAddress 
}: EditRuleModalProps) {
  const [loading, setLoading] = useState(false)
  const [newPrice, setNewPrice] = useState(protection?.trigger_price || 0)
  const [showWarning, setShowWarning] = useState(false)
  const [demonType, setDemonType] = useState<'greed' | 'fear'>('greed')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      
      const isIncreasingTP = protection.action_type === 'take_profit' && newPrice > protection.trigger_price
      const isDecreasingStop = protection.action_type === 'stop_loss' && newPrice < protection.trigger_price
      
      if (isIncreasingTP) {
        await supabase
          .from('demon_tracker')
          .insert({
            wallet_address: walletAddress.toLowerCase(),
            demon_type: 'greed',
            severity: 'medium',
            event_data: {
              action: 'increased_take_profit',
              old_price: protection.trigger_price,
              new_price: newPrice,
              token_pair: protection.token_pair
            }
          })
        setDemonType('greed')
      }
      
      if (isDecreasingStop) {
        const { data: fearHistory } = await supabase
          .from('demon_tracker')
          .select('*')
          .eq('wallet_address', walletAddress)
          .eq('demon_type', 'fear')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        
        const fearCount = (fearHistory?.length || 0) + 1
        
        await supabase
          .from('demon_tracker')
          .insert({
            wallet_address: walletAddress,
            demon_type: 'fear',
            severity: fearCount >= 3 ? 'high' : 'medium',
            event_data: {
              action: 'decreased_stop_loss',
              old_price: protection.trigger_price,
              new_price: newPrice,
              modification_count: fearCount
            }
          })
        setDemonType('fear')
      }
      
      await supabase
        .from('protection_rules')
        .update({ trigger_price: newPrice })
        .eq('id', protection.id)
      
      if (isIncreasingTP || isDecreasingStop) {
        setShowWarning(true)
      } else {
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Error updating rule:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWarningClose = () => {
    setShowWarning(false)
    onSuccess()
    onClose()
  }

  if (!protection) return null

  return (
    <>
      <AnimatePresence>
        {show && !showWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="zen-card max-w-md w-full p-8 space-y-6"
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  EDIT PROTECTION
                </h3>
                <p className="text-sm text-slate-500 normal-case tracking-normal">
                  {protection.token_pair} - {protection.action_type === 'take_profit' ? 'Take Profit' : 'Stop Loss'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 normal-case tracking-normal">
                    New Trigger Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sage-300"
                  />
                  <p className="text-xs text-slate-500 mt-1 normal-case tracking-normal">
                    Current: ${protection.trigger_price}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-zen"
                  >
                    {loading ? 'SAVING...' : 'SAVE'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: -100 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="zen-card max-w-md w-full p-8 space-y-6"
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  {demonType === 'greed' ? '🤑' : '😨'}
                </motion.div>
                <h3 className="text-2xl font-semibold text-slate-700 mb-2">
                  {demonType === 'greed' ? 'GREED DEMON' : 'FEAR DEMON'} DETECTED
                </h3>
                <p className="text-amber-600 text-sm normal-case tracking-normal">
                  {demonType === 'greed'
                    ? "You've increased your Take Profit target"
                    : "You've lowered your Stop Loss"}
                </p>
              </div>

              <div className="bg-beige-50 rounded-lg p-4">
                <p className="text-sm text-slate-600 normal-case tracking-normal">
                  {demonType === 'greed'
                    ? "💰 Protecting gains is winning. Don't let greed steal your victory."
                    : "😨 Fear clouds judgment. Trust your original plan."}
                </p>
              </div>

              <div className="text-xs text-slate-500 text-center normal-case tracking-normal">
                <p>Old target: ${protection.trigger_price}</p>
                <p>New target: ${newPrice}</p>
              </div>

              <button
                onClick={handleWarningClose}
                className="w-full btn-zen py-3"
              >
                I UNDERSTAND
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}