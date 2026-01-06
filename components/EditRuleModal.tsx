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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      
      console.log('🔍 Edit Protection:', {
        action_type: protection.action_type,
        old_price: protection.trigger_price,
        new_price: newPrice,
        wallet: walletAddress
      })
      
      // Check if increasing TP (greed detection)
      const isIncreasingTP = protection.action_type === 'take_profit' && newPrice > protection.trigger_price
      
      console.log('🤑 Is Increasing TP?', isIncreasingTP)
      
      if (isIncreasingTP) {
        console.log('🎯 GREED DETECTED! Inserting demon...')
        
        // Insert greed demon
        const { data: insertData, error: insertError } = await supabase
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
          .select()
        
        if (insertError) {
          console.error('❌ Error inserting demon:', insertError)
        } else {
          console.log('✅ Demon inserted successfully!', insertData)
        }
      }
      
      // Update rule
      const { error: updateError } = await supabase
        .from('protection_rules')
        .update({ trigger_price: newPrice })
        .eq('id', protection.id)
      
      if (updateError) {
        console.error('❌ Error updating rule:', updateError)
      } else {
        console.log('✅ Rule updated successfully!')
      }
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('💥 Fatal error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!protection) return null

  return (
    <AnimatePresence>
      {show && (
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
  )
}