'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Shield, Plus, LogOut, TrendingUp, Flame, Trophy, Target, CheckCircle, Bell } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [score, setScore] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    checkUser()
    
    if (searchParams?.get('rule_created') === 'true') {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }
  }, [searchParams])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }
    
    setUser(user)
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileData) {
      setProfile(profileData)
      setScore(calculateScore(profileData))
    }

    const { data: rulesData } = await supabase
      .from('trading_rules')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (rulesData) {
      setRules(rulesData)
      setStreak(rulesData.length > 0 ? 1 : 0)
    }
    
    setLoading(false)
  }

  const calculateScore = (profile: any) => {
    return (profile.total_executions * 20) + (rules.length * 10)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getStreakBadge = (days: number) => {
    if (days === 0) return { emoji: '🌱', title: 'Rookie', color: 'text-slate-400' }
    if (days < 7) return { emoji: '🔥', title: 'Starting', color: 'text-orange-400' }
    if (days < 30) return { emoji: '💪', title: 'Warrior', color: 'text-yellow-400' }
    if (days < 100) return { emoji: '💎', title: 'Diamond Hands', color: 'text-cyan-400' }
    return { emoji: '👑', title: 'Legend', color: 'text-purple-400' }
  }

  const getRuleTypeInfo = (ruleType: string) => {
    const types: any = {
      take_profit: { label: 'Take Profit', color: 'text-green-500', bg: 'bg-green-500/10' },
      stop_loss: { label: 'Stop Loss', color: 'text-red-500', bg: 'bg-red-500/10' },
      price_target: { label: 'Prix Cible', color: 'text-blue-500', bg: 'bg-blue-500/10' }
    }
    return types[ruleType] || types.take_profit
  }

  const badge = getStreakBadge(streak)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {showSuccess && (
        <div className="fixed top-20 right-4 z-50">
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-3 shadow-xl">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <div>
              <div className="font-semibold text-green-400">Règle créée ! 🎉</div>
              <div className="text-sm text-slate-400">+10 pts de discipline</div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed top-0 w-full z-50 glass border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-cyan-500" />
              <span className="text-2xl font-bold gradient-text">NoFOMO</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-sm px-3 py-1 bg-slate-800 rounded-lg">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-slate-400">{streak} jours</span>
              </div>
              <span className="text-sm text-slate-400 hidden md:block px-3">
                {user?.email}
              </span>
              <Link href="/notifications">
                <Button variant="ghost" size="icon">
                  <Bell className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Bienvenue Warrior ! 👋
            </h1>
            <p className="text-slate-400 text-lg">
              {rules.length === 0 
                ? 'Crée ta première règle pour commencer à protéger tes gains'
                : `Tu as ${rules.length} règle${rules.length > 1 ? 's' : ''} active${rules.length > 1 ? 's' : ''}`
              }
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="border-orange-500/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardDescription>Streak de discipline</CardDescription>
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <CardTitle className="text-4xl">{streak}</CardTitle>
                  <span className="text-slate-400">jours</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`flex items-center gap-2 ${badge.color}`}>
                  <span className="text-2xl">{badge.emoji}</span>
                  <span className="font-semibold">{badge.title}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-cyan-500/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardDescription>Score de discipline</CardDescription>
                  <Trophy className="w-5 h-5 text-cyan-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <CardTitle className="text-4xl">{score}</CardTitle>
                  <span className="text-slate-400">pts</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-400">
                  Rang : <span className="text-cyan-500 font-semibold">Top 50%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-500/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardDescription>Gains protégés</CardDescription>
                  <Target className="w-5 h-5 text-green-500" />
                </div>
                <CardTitle className="text-4xl text-green-500">
                  ${profile?.total_profit_saved?.toFixed(0) || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-400">
                  {profile?.total_executions || 0} règles exécutées
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Tes règles actives</h2>
            <Link href="/rules/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Créer une règle
              </Button>
            </Link>
          </div>

          {rules.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="w-10 h-10 text-cyan-500" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3">
                    Crée ta première règle
                  </h3>
                  
                  <p className="text-slate-400 mb-6">
                    Protège tes gains automatiquement. Simple comme &quot;Vendre 50% si +60%&quot;
                  </p>
                  
                  <Link href="/rules/create">
                    <Button size="lg">
                      <Plus className="w-5 h-5 mr-2" />
                      Créer ma première règle
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rules.map((rule) => {
                const typeInfo = getRuleTypeInfo(rule.rule_type)
                return (
                  <Card key={rule.id} className="hover:border-cyan-500/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{rule.rule_name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${typeInfo.bg} ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500">
                              ✓ Actif
                            </span>
                          </div>
                          
                          <div className="text-sm text-slate-400 space-y-1">
                            <div>Token : <span className="text-white font-mono">{rule.token_symbol}</span></div>
                            <div>
                              Déclenchement : <span className="text-white">{rule.trigger_value}%</span>
                            </div>
                            <div>
                              Action : <span className="text-white">Vendre {rule.sell_percent}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right text-sm text-slate-500">
                          Créée {new Date(rule.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
