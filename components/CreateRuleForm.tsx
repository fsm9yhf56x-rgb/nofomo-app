'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'

interface CreateRuleFormProps {
  onSuccess: () => void
}

export default function CreateRuleForm({ onSuccess }: CreateRuleFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    tokenPair: 'BTC/USDT',
    actionType: 'take_profit',
    triggerPrice: '',
    sellPercentage: 50
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
if (authError || !user) {
  console.error('Auth error:', authError)
  alert('Please refresh the page and reconnect your wallet')
  return
}
      
      if (!user) return

      // Create rule
      const { error } = await supabase
        .from('protection_rules')
        .insert({
          user_id: user.id,
          token_pair: formData.tokenPair,
          action_type: formData.actionType,
          trigger_price: parseFloat(formData.triggerPrice),
          sell_percentage: formData.sellPercentage,
          is_active: true
        })

      if (error) throw error

      // Award XP
      await fetch('/api/xp/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'first_rule_created', xp: 50 })
      })

      // Award points (invisible)
      await fetch('/api/points/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rule_created', points: 25 })
      })

      // Show success animation
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setIsOpen(false)
        onSuccess()
      }, 2000)

    } catch (error) {
      console.error('Error creating rule:', error)
      alert('Error creating protection. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-zen text-lg px-8 py-4"
      >
        + Create your first protection
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="zen-card max-w-md w-full p-8 space-y-6"
            >
              {!showSuccess ? (
                <>
                  <div className="text-center">
                    <div className="text-4xl mb-2">🛡️</div>
                    <h2 className="text-2xl font-semibold text-slate-700">
                      Create Protection
                    </h2>
                    <p className="text-slate-500 text-sm mt-2">
                      Set an automatic rule to protect your gains
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Token Pair
                      </label>
                      <select
                        value={formData.tokenPair}
                        onChange={(e) => setFormData({...formData, tokenPair: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sage-300"
                      >
                        <option>BTC/USDT</option>
                        <option>ETH/USDT</option>
                        <option>SOL/USDT</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Action Type
                      </label>
                      <select
                        value={formData.actionType}
                        onChange={(e) => setFormData({...formData, actionType: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sage-300"
                      >
                        <option value="take_profit">Take Profit (Sell when up)</option>
                        <option value="stop_loss">Stop Loss (Sell when down)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Trigger Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.triggerPrice}
                        onChange={(e) => setFormData({...formData, triggerPrice: e.target.value})}
                        placeholder="e.g., 50000"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sage-300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Sell {formData.sellPercentage}% of position
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="10"
                        value={formData.sellPercentage}
                        onChange={(e) => setFormData({...formData, sellPercentage: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 btn-zen"
                      >
                        {loading ? 'Creating...' : 'Create Protection'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ duration: 0.5 }}
                    className="text-8xl mb-4"
                  >
                    🛡️
                  </motion.div>
                  <h3 className="text-2xl font-semibold text-slate-700 mb-2">
                    Protection Created!
                  </h3>
                  <p className="text-sage-600">
                    +50 XP earned 🌟
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}