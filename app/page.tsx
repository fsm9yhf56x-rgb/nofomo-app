'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import KnightAvatar from '@/components/KnightAvatar'
import XPBar from '@/components/XPBar'
import CreateRuleForm from '@/components/CreateRuleForm'
import ProtectionCard from '@/components/ProtectionCard'
import DemonCounter from '@/components/DemonCounter'
import LevelUpModal from '@/components/LevelUpModal'
import InterventionModal from '@/components/InterventionModal'
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
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [previousLevel, setPreviousLevel] = useState(1)
  const [showIntervention, setShowIntervention] = useState(false)
  const [interventionData, setInterventionData] = useState({
    demonType: '',
    context: '',
    protectionId: ''
  })

  useEffect(() => {
    if (isConnected && address) {
      loadUserData()
    }
  }, [isConnected, address])

  const loadUserData = async () => {
    if (!address) return
    
    const supabase = createClient()
    const walletAddress = address.toLowerCase()

    const { data: profile } = await supabase
      .from('user_profile')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    if (profile) {
      if (profile.level > previousLevel && previousLevel > 0) {
        setShowLevelUp(true)
      }
      setPreviousLevel(profile.level)
      
      setUserProfile({
        level: profile.level,
        xp: profile.xp,
        streak_days: profile.streak_days
      })
    }

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

  const handleDisableProtection = async (protectionId: string) => {
    if (!address) return
    
    const supabase = createClient()
    
    const { data: protection } = await supabase
      .from('protection_rules')
      .select('*')
      .eq('id', protectionId)
      .single()
    
    if (!protection) return
    
    const hoursActive = (Date.now() - new Date(protection.created_at).getTime()) / (1000 * 60 * 60)
    
    if (hoursActive < 24) {
      await supabase
        .from('demon_tracker')
        .insert({
          wallet_address: address.toLowerCase(),
          demon_type: 'impatience',
          severity: 'medium',
          event_data: {
            action: 'disabled_protection_early',
            hours_active: hoursActive,
            protection_id: protectionId
          }
        })
      
      setInterventionData({
        demonType: 'impatience',
        context: `You're disabling this protection after just ${Math.floor(hoursActive)} hours.`,
        protectionId: protectionId
      })
      setShowIntervention(true)
      return
    }
    
    await supabase
      .from('protection_rules')
      .update({ is_active: false })
      .eq('id', protectionId)
    
    loadUserData()
  }

  const handleInterventionAccept = () => {
    setShowIntervention(false)
  }

  const handleInterventionDismiss = async () => {
    setShowIntervention(false)
    const supabase = createClient()
    await supabase
      .from('protection_rules')
      .update({ is_active: false })
      .eq('id', interventionData.protectionId)
    loadUserData()
  }

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
            WELCOME TO NOFOMO
          </h1>
          <p className="text-slate-600 normal-case tracking-normal">
            A haven of peace to protect your crypto gains
          </p>
          <p className="text-sm text-slate-500 normal-case tracking-normal">
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
      <header className="glass border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-semibold text-slate-700">
            🏰 NOFOMO
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-600 hover:text-slate-800 transition-colors text-sm">
              ☕ ZEN MODE
            </button>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          
          {/* LEFT SIDEBAR - RPG Style */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-12 md:col-span-3 space-y-4"
          >
            {/* Knight Avatar */}
            <div className="zen-card p-6 aspect-square flex flex-col items-center justify-center">
              <KnightAvatar level={userProfile.level} />
              <div className="mt-4 w-full">
                <XPBar 
                  current={userProfile.xp} 
                  max={userProfile.level * 1000} 
                />
              </div>
            </div>

            {/* Demons Vertical Card */}
            {address && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <DemonCounter walletAddress={address} />
              </motion.div>
            )}
          </motion.div>

          {/* RIGHT CONTENT */}
          <div className="col-span-12 md:col-span-9 space-y-4">
            
            {/* Greeting + Flame */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div>
                <h2 className="text-2xl font-semibold text-slate-700">
                  GOOD MORNING, KNIGHT 🌿
                </h2>
                <p className="text-sm text-slate-500 normal-case tracking-normal">
                  Your protections are active
                </p>
              </div>
              
              {/* Compact Flame */}
              <div className="flex items-center gap-3 bg-beige-50 rounded-xl px-4 py-2">
                <motion.div
                  className="text-3xl"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  🔥
                </motion.div>
                <div>
                  <div className="text-lg font-semibold text-slate-700">
                    {userProfile.streak_days} DAYS
                  </div>
                  <div className="text-xs text-slate-500 normal-case tracking-normal">Keep going 💙</div>
                </div>
              </div>
            </motion.div>

            {/* Compact Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-3"
            >
              <div className="zen-card p-4 text-center">
                <div className="text-2xl mb-1">💎</div>
                <div className="text-lg font-semibold text-slate-700">$0</div>
                <div className="text-xs text-slate-500">GAINS</div>
              </div>
              
              <div className="zen-card p-4 text-center">
                <div className="text-2xl mb-1">🛡️</div>
                <div className="text-lg font-semibold text-slate-700">{rulesCount}</div>
                <div className="text-xs text-slate-500">PROTECTIONS</div>
              </div>
              
              <div className="zen-card p-4 text-center">
                <div className="text-2xl mb-1">👻</div>
                <div className="text-lg font-semibold text-slate-700">QUIET</div>
                <div className="text-xs text-slate-500">DEMONS</div>
              </div>
            </motion.div>

            {/* Active Protections */}
            {protections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                  🛡️ YOUR ACTIVE PROTECTIONS
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {protections.map((protection) => (
                    <ProtectionCard 
                      key={protection.id} 
                      protection={protection}
                      onDisable={handleDisableProtection}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* CTA - After protections */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center pt-4"
            >
              <CreateRuleForm 
                onSuccess={loadUserData} 
                hasProtections={protections.length > 0}
              />
            </motion.div>

          </div>
        </div>
      </main>

      <InterventionModal
        show={showIntervention}
        demonType={interventionData.demonType}
        context={interventionData.context}
        onAccept={handleInterventionAccept}
        onDismiss={handleInterventionDismiss}
      />

      <LevelUpModal 
        show={showLevelUp}
        newLevel={userProfile.level}
        onClose={() => setShowLevelUp(false)}
      />
    </div>
  )
}