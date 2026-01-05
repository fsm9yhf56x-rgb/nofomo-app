'use client'

import { motion } from 'framer-motion'

interface Protection {
  id: string
  token_pair: string
  action_type: string
  trigger_price: number
  sell_percentage: number
  is_active: boolean
  created_at: string
}

interface ProtectionCardProps {
  protection: Protection
}

export default function ProtectionCard({ protection }: ProtectionCardProps) {
  const isProfit = protection.action_type === 'take_profit'
  
  // Calculate days active
  const daysActive = Math.floor(
    (Date.now() - new Date(protection.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
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
            <div className="text-xs text-slate-500">
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
          <div className="text-xs text-slate-500">Trigger Price</div>
          <div className="text-lg font-semibold text-slate-700">
            ${protection.trigger_price.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Sell Amount</div>
          <div className="text-lg font-semibold text-slate-700">
            {protection.sell_percentage}%
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-sage-600 flex items-center gap-2">
          <span>✓</span>
          <span>Active and watching</span>
        </div>
        <button className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
          Edit
        </button>
      </div>
    </motion.div>
  )
}