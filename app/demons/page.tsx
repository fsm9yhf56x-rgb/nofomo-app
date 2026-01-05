'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'

interface DemonEvent {
  id: string
  demon_type: string
  severity: string
  event_data: any
  created_at: string
}

export default function DemonsPage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const [demons, setDemons] = useState<DemonEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    byType: {} as Record<string, number>,
    mostActive: '',
    mostActiveDay: '',
    peakHour: 0
  })

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
      return
    }
    if (address) {
      loadDemonHistory()
    }
  }, [address, isConnected, router])

  const loadDemonHistory = async () => {
    if (!address) return
    
    const supabase = createClient()
    
    // Get all demons
    const { data: demonData } = await supabase
      .from('demon_tracker')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
      .order('created_at', { ascending: false })

    if (demonData && demonData.length > 0) {
      setDemons(demonData)
      
      // Calculate stats
      const byType: Record<string, number> = demonData.reduce((acc, demon) => {
        acc[demon.demon_type] = (acc[demon.demon_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const sortedTypes = Object.entries(byType).sort((a, b) => b[1] - a[1])
      const mostActive = sortedTypes.length > 0 ? sortedTypes[0][0] : 'none'
      // Analyze by day of week
      const byDay = demonData.reduce((acc, demon) => {
        const day = new Date(demon.created_at).toLocaleDateString('en-US', { weekday: 'long' })
        acc[day] = (acc[day] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const mostActiveDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'
      
      // Analyze by hour
      const byHour = demonData.reduce((acc, demon) => {
        const hour = new Date(demon.created_at).getHours()
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      }, {} as Record<number, number>)
      
      const peakHour = parseInt(Object.entries(byHour).sort((a, b) => b[1] - a[1])[0]?.[0] || '0')
      
      setStats({
        total: demonData.length,
        byType,
        mostActive,
        mostActiveDay,
        peakHour
      })
    }
    
    setLoading(false)
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

  const getDemonColor = (type: string) => {
    const colors: any = {
      fomo: 'text-amber-600 bg-amber-50',
      greed: 'text-green-600 bg-green-50',
      impatience: 'text-orange-600 bg-orange-50',
      revenge: 'text-red-600 bg-red-50',
      fear: 'text-purple-600 bg-purple-50'
    }
    return colors[type] || 'text-slate-600 bg-slate-50'
  }

  const formatTimeAgo = (date: string) => {
    const now = Date.now()
    const then = new Date(date).getTime()
    const diff = now - then
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`
    if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
    if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
    return 'Just now'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-beige-50 via-white to-lavender-50 flex items-center justify-center">
        <div className="text-slate-600">Loading your demon history...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-beige-50 via-white to-lavender-50">
      {/* Header */}
      <header className="glass border-b border-slate-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-slate-600 hover:text-slate-800 transition-colors flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <div className="text-2xl font-semibold text-slate-700">
            👻 Your Inner Demons
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="zen-card p-6">
            <div className="text-sm text-slate-500 mb-1">Total Encounters</div>
            <div className="text-3xl font-bold text-slate-700">{stats.total}</div>
          </div>
          
          <div className="zen-card p-6">
            <div className="text-sm text-slate-500 mb-1">Most Active</div>
            <div className="text-3xl font-bold text-slate-700 capitalize flex items-center gap-2">
              {getDemonEmoji(stats.mostActive)} {stats.mostActive}
            </div>
          </div>
          
          <div className="zen-card p-6">
            <div className="text-sm text-slate-500 mb-1">Peak Time</div>
            <div className="text-3xl font-bold text-slate-700">
              {stats.peakHour}:00
            </div>
          </div>
        </motion.div>

        {/* Insights */}
        {demons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="zen-card p-6 space-y-3"
          >
            <h3 className="text-lg font-semibold text-slate-700">💡 Insights</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p>• Your demons are most active on <span className="font-semibold text-sage-600">{stats.mostActiveDay}s</span></p>
              <p>• Peak activity around <span className="font-semibold text-sage-600">{stats.peakHour}:00</span></p>
              <p>• <span className="font-semibold text-sage-600 capitalize">{stats.mostActive}</span> demon appears most frequently</p>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <p className="text-sm text-slate-500 italic">
                💙 Tip: Consider enabling "Zen Mode" during your peak demon hours to stay disciplined
              </p>
            </div>
          </motion.div>
        )}

        {/* History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-semibold text-slate-700">Complete History</h3>
          
          {demons.length === 0 ? (
            <div className="zen-card p-12 text-center">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                No demons yet!
              </h3>
              <p className="text-slate-500">
                You're maintaining perfect discipline. Keep going! 🌿
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {demons.map((demon, index) => (
                <motion.div
                  key={demon.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="zen-card p-4 flex items-center gap-4"
                >
                  <div className="text-4xl">{getDemonEmoji(demon.demon_type)}</div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getDemonColor(demon.demon_type)}`}>
                        {demon.demon_type}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatTimeAgo(demon.created_at)}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {demon.event_data?.action === 'disabled_protection_early' && (
                        `Disabled protection after ${Math.floor(demon.event_data.hours_active)} hours`
                      )}
                    </div>
                  </div>
                  
                  <div className={`text-xs font-medium capitalize px-3 py-1 rounded-full ${
                    demon.severity === 'high' ? 'bg-red-100 text-red-600' :
                    demon.severity === 'medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {demon.severity}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}