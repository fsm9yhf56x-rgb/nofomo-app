'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'

interface DemonCounterProps {
  walletAddress: string
}

export default function DemonCounter({ walletAddress }: DemonCounterProps) {
  const router = useRouter()
  const [demonStats, setDemonStats] = useState({
    total: 0,
    byType: {
      fomo: 0,
      greed: 0,
      impatience: 0,
      revenge: 0,
      fear: 0
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDemonStats()
  }, [walletAddress])

  const loadDemonStats = async () => {
    const supabase = createClient()
    
    // Get all demons for this wallet
    const { data: demons } = await supabase
      .from('demon_tracker')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .order('created_at', { ascending: false })

    if (demons) {
      const stats = {
        total: demons.length,
        byType: {
          fomo: demons.filter(d => d.demon_type === 'fomo').length,
          greed: demons.filter(d => d.demon_type === 'greed').length,
          impatience: demons.filter(d => d.demon_type === 'impatience').length,
          revenge: demons.filter(d => d.demon_type === 'revenge').length,
          fear: demons.filter(d => d.demon_type === 'fear').length,
        }
      }
      setDemonStats(stats)
    }
    
    setLoading(false)
  }

  const getMostActiveDemon = () => {
    const entries = Object.entries(demonStats.byType)
    const sorted = entries.sort((a, b) => b[1] - a[1])
    return sorted[0]
  }

  const getDemonEmoji = (type: string) => {
    const emojis: any = {
      fomo: '😰',
      greed: '🤑',
      impatience: '😤',
      revenge: '😡',
      fear: '😨'
    }
    return emojis[type] || '👻'
  }

  const getMessage = () => {
    if (demonStats.total === 0) return "All demons are quiet ✨"
    if (demonStats.total === 1) return "One demon encountered 💙"
    const [mostActive] = getMostActiveDemon()
    return `${demonStats.total} demons encountered - ${mostActive} is most active`
  }

  if (loading) {
    return (
      <div className="zen-card p-6 text-center">
        <div className="animate-pulse">Loading demons...</div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="zen-card p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">Your Inner Demons</div>
          <div className="text-2xl font-semibold text-slate-700">
            {demonStats.total} encountered
          </div>
        </div>
        <div className="text-4xl">
          👻
        </div>
      </div>

      {/* Message */}
      <div className="text-sm text-slate-600 bg-beige-50 rounded-lg p-3">
        {getMessage()}
      </div>

      {/* Demon Types */}
      {demonStats.total > 0 && (
        <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-100">
          {Object.entries(demonStats.byType).map(([type, count]) => (
            <div key={type} className="text-center">
              <div className="text-2xl mb-1">
                {getDemonEmoji(type)}
              </div>
              <div className="text-xs text-slate-500 capitalize">{type}</div>
              <div className="text-sm font-semibold text-slate-700">{count}</div>
            </div>
          ))}
        </div>
      )}

      {/* View Details Link */}
      {demonStats.total > 0 && (
        <div className="text-center pt-2">
          <button 
            onClick={() => router.push('/demons')}
            className="text-xs text-sage-600 hover:text-sage-700 transition-colors"
          >
            View detailed history →
          </button>
        </div>
      )}
    </motion.div>
  )
}