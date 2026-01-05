'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import KnightAvatar from '@/components/KnightAvatar'
import XPBar from '@/components/XPBar'
import FlameStreak from '@/components/FlameStreak'
import CreateRuleForm from '@/components/CreateRuleForm'
import ProtectionCard from '@/components/ProtectionCard'
import { createClient } from '@/utils/supabase/client'

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const [userProfile, setUserProfile] = useState({
    level: 1,
    xp: 0,
    streak_days: 0
  })
  const [rulesCount, setRulesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [protections, setProtections] = useState<any[]>([])

  // Fetch user profile and rules
  useEffect(() => {
    if (isConnected && address) {
      loadUserData()
    }
  }, [isConnected, address])

const loadUserData = async () => {
    if (!address) return
    
    const supabase = createClient()
    const walletAddress = address.toLowerCase()

    // Get profile by wallet address
    const { data: profile } = await supabase
      .from('user_profile')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    if (profile) {
      setUserProfile({
        level: profile.level,
        xp: profile.xp,
        streak_days: profile.streak_days
      })
    }

    // Get rules with full data
  const { data: rules, count } = await supabase
    .from('protection_rules')
    .select('*', { count: 'exact' })
    .eq('wallet_address', walletAddress)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  setProtections(rules || [])
  setRulesCount(count || 0)
    setLoading(false)
  }

  // Award points on wallet connect
  useEffect(() => {
    if (isConnected && address) {
      fetch('/api/points/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'wallet_connected', 
          points: 10 
        })
      })
    }
  }, [isConnected, address])

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-beige-50 via-white to-lavender-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="zen-card p-12 max-w-md text-center space-y-6"
        >
          <div className="text-6xl mb-4">🏰</div>
          <h1 className="text-3xl font-semibold text-slate-700">
            Welcome to NoFOMO
          </h1>
          <p className="text-slate-600">
            A haven of peace to protect your crypto gains
          </p>
          <p className="text-sm text-slate-500">
            Combat your emotions, not the market
          </p>
          <div className="pt-4">
            <ConnectButton />
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-beige-50 via-white to-lavender-50">
      {/* Header */}
      <header className="glass border-b border-slate-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-semibold text-slate-700">
            🏰 NoFOMO
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-600 hover:text-slate-800 transition-colors">
              ☕ Zen Mode
            </button>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-3xl font-medium text-slate-700 mb-2">
            Good morning, Knight 🌿
          </h2>
          <p className="text-slate-500">
            Your protections are active and watching
          </p>
        </motion.div>

        {/* Knight Avatar Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="zen-card p-8"
        >
          <KnightAvatar level={userProfile.level} />
          <div className="mt-6">
            <XPBar 
              current={userProfile.xp} 
              max={userProfile.level * 1000} 
            />
          </div>
        </motion.div>

        {/* Flame Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <FlameStreak days={userProfile.streak_days} />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="zen-card p-6 text-center">
            <div className="text-3xl mb-2">💎</div>
            <div className="text-2xl font-semibold text-slate-700">$0</div>
            <div className="text-sm text-slate-500">Gains protected</div>
          </div>
          
          <div className="zen-card p-6 text-center">
            <div className="text-3xl mb-2">🛡️</div>
            <div className="text-2xl font-semibold text-slate-700">{rulesCount}</div>
            <div className="text-sm text-slate-500">Active protections</div>
          </div>
          
          <div className="zen-card p-6 text-center">
            <div className="text-3xl mb-2">👻</div>
            <div className="text-2xl font-semibold text-slate-700">Quiet</div>
            <div className="text-sm text-slate-500">Demons status</div>
          </div>
        </motion.div>
        
        {/* Active Protections List */}
        {protections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold text-slate-700 flex items-center gap-2">
              🛡️ Your Active Protections
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {protections.map((protection) => (
                <ProtectionCard key={protection.id} protection={protection} />
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <CreateRuleForm onSuccess={loadUserData} />
        </motion.div>
      </main>
    </div>
  )
}