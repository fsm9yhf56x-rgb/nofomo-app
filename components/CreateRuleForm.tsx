'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import { createClient } from '@/utils/supabase/client'

interface CreateRuleFormProps {
  onSuccess: () => void
  hasProtections?: boolean
}

export default function CreateRuleForm({ onSuccess, hasProtections }: CreateRuleFormProps) {
  const { address } = useAccount()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    tokenPair: 'BTC/USDT',
    actionType: 'take_profit',
    triggerPrice: 0,
    sellPercentage: 50
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) return
    
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Create rule
      const { data: newRule, error: ruleError } = await supabase
        .from('protection_rules')
        .insert({
          wallet_address: address.toLowerCase(),
          token_pair: formData.tokenPair,
          action_type: formData.actionType,
          trigger_price: formData.triggerPrice,
          sell_percentage: formData.sellPercentage,
          is_active: true
        })
        .select()
        .single()

      if (ruleError) throw ruleError

      // Check for FOMO demon (creating rule during pump)
      if (newRule && address) {
        const pumpCheck = await fetch('/api/market/check-pump', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenPair: formData.tokenPair })
        })
        const { isPumping, pumpPercentage } = await pumpCheck.json()
        
        if (isPumping) {
          await supabase
            .from('demon_tracker')
            .insert({
              wallet_address: address.toLowerCase(),
              demon_type: 'fomo',
              severity: 'medium',
              event_data: {
                action: 'created_protection_during_pump',
                pump_percentage: pumpPercentage,
                token_pair: formData.tokenPair
              }
            })
          
          alert(`😰 FOMO Demon Detected!\n\n${formData.tokenPair} is pumping +${pumpPercentage}%\n\nFOMO whispers urgently, but discipline feels better tomorrow.`)
        }
      }

      // Check for REVENGE demon (creating rule right after disabling one)
      if (newRule && address && typeof window !== 'undefined') {
        const lastDisableTime = sessionStorage.getItem('lastDisableTime')
        if (lastDisableTime) {
          const minutesSinceDisable = (Date.now() - parseInt(lastDisableTime)) / (1000 * 60)
          
          if (minutesSinceDisable < 10) {
            await supabase
              .from('demon_tracker')
              .insert({
                wallet_address: address.toLowerCase(),
                demon_type: 'revenge',
                severity: 'high',
                event_data: {
                  action: 'created_protection_after_disable',
                  minutes_since_disable: Math.floor(minutesSinceDisable),
                  token_pair: formData.tokenPair
                }
              })
            
            alert(`😡 Revenge Demon Detected!\n\nYou disabled a protection ${Math.floor(minutesSinceDisable)} minutes ago.\n\nWait 2 hours for clarity before creating new positions.`)
          }
        }
      }

      // Award XP
      await fetch('/api/xp/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'protection_created',
          xp: 50,
          wallet_address: address.toLowerCase()
        })
      })

      // Award invisible points
      await fetch('/api/points/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'protection_created',
          points: 25,
          wallet_address: address.toLowerCase()
        })
      })

      // Success animation
      setIsOpen(false)
      onSuccess()
      
      // Reset form
      setFormData({
        tokenPair: 'BTC/USDT',
        actionType: 'take_profit',
        triggerPrice: 0,
        sellPercentage: 50
      })
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
        {hasProtections ? 'CREATE PROTECTION' : 'CREATE YOUR FIRST PROTECTION'}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="zen-card max-w-md w-full p-8 space-y-6"
            >
              <div className="text-center">
                <div className="text-5xl mb-4">🛡️</div>
                <h3 className="text-2xl font-semibold text-slate-700 mb-2">
                  CREATE PROTECTION
                </h3>
                <p className="text-sm text-slate-500 normal-case tracking-normal">
                  Set your rules and let discipline watch over your gains
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 normal-case tracking-normal">
                    Token Pair
                  </label>
                  <select
                    value={formData.tokenPair}
                    onChange={(e) => setFormData({ ...formData, tokenPair: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sage-300"
                  >
                    <option value="BTC/USDT">BTC/USDT</option>
                    <option value="ETH/USDT">ETH/USDT</option>
                    <option value="SOL/USDT">SOL/USDT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 normal-case tracking-normal">
                    Action Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, actionType: 'take_profit' })}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        formData.actionType === 'take_profit'
                          ? 'bg-sage-400 text-white border-sage-400'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      TAKE PROFIT
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, actionType: 'stop_loss' })}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        formData.actionType === 'stop_loss'
                          ? 'bg-sage-400 text-white border-sage-400'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      STOP LOSS
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 normal-case tracking-normal">
                    Trigger Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.triggerPrice || ''}
                    onChange={(e) => setFormData({ ...formData, triggerPrice: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sage-300"
                    placeholder="e.g. 50000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 normal-case tracking-normal">
                    Sell Percentage: {formData.sellPercentage}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={formData.sellPercentage}
                    onChange={(e) => setFormData({ ...formData, sellPercentage: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-zen py-3"
                  >
                    {loading ? 'CREATING...' : 'CREATE'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}