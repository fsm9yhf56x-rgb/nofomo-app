'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Shield, TrendingUp, LogOut, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/lib/hooks/useUser'
import { supabase } from '@/lib/supabase'

interface Rule {
  id: string
  name: string
  token_symbol: string
  platform: string
  take_profit_percent: number | null
  stop_loss_percent: number | null
  sell_percent: number
  is_active: boolean
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { user, loading } = useUser()
  const [rules, setRules] = useState<Rule[]>([])
  const [loadingRules, setLoadingRules] = useState(true)

  // Rediriger vers login si pas connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Charger les règles
  useEffect(() => {
    const fetchRules = async () => {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('trading_rules')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setRules(data || [])
      } catch (err) {
        console.error('Erreur lors du chargement des règles:', err)
      } finally {
        setLoadingRules(false)
      }
    }

    fetchRules()
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleToggleRule = async (ruleId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('trading_rules')
        .update({ is_active: !currentStatus })
        .eq('id', ruleId)

      if (error) throw error

      // Mettre à jour l'état local
      setRules(rules.map(rule => 
        rule.id === ruleId ? { ...rule, is_active: !currentStatus } : rule
      ))
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Es-tu sûr de vouloir supprimer cette règle ?')) return

    try {
      const { error } = await supabase
        .from('trading_rules')
        .delete()
        .eq('id', ruleId)

      if (error) throw error

      // Retirer de l'état local
      setRules(rules.filter(rule => rule.id !== ruleId))
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
    }
  }

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <Shield className="w-16 h-16 text-cyan-500 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    )
  }

  // Ne rien afficher si pas d'utilisateur (redirection en cours)
  if (!user) {
    return null
  }

  const activeRules = rules.filter(r => r.is_active).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header avec bouton wallet et logout */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-slate-800 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-cyan-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                NoFOMO
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">🔥 0 jours</span>
              <span className="text-sm text-slate-400">{user.email}</span>
              <ConnectButton />
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-5 h-5 text-slate-400 hover:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Titre */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Bienvenue Warrior ! 👋
            </h1>
            <p className="text-slate-400 text-lg">
              {rules.length === 0 
                ? "Crée ta première règle pour commencer à protéger tes gains"
                : `Tu as ${activeRules} règle${activeRules > 1 ? 's' : ''} active${activeRules > 1 ? 's' : ''}`
              }
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {/* Streak de discipline */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium text-slate-400">
                    Streak de discipline
                  </CardTitle>
                  <span className="text-orange-500">🔥</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">0 <span className="text-lg text-slate-400">jours</span></div>
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <span>🌱 Rookie</span>
                </div>
              </CardContent>
            </Card>

            {/* Score de discipline */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium text-slate-400">
                    Règles actives
                  </CardTitle>
                  <span className="text-cyan-500">📋</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">{activeRules}</div>
                <div className="text-sm text-slate-400">
                  sur {rules.length} règle{rules.length > 1 ? 's' : ''} créée{rules.length > 1 ? 's' : ''}
                </div>
              </CardContent>
            </Card>

            {/* Gains protégés */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium text-slate-400">
                    Gains protégés
                  </CardTitle>
                  <span className="text-green-500">🎯</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-500 mb-2">$0</div>
                <div className="text-sm text-slate-400">
                  0 règles exécutées
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section Règles actives */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Tes règles actives</h2>
              <Link 
                href="/rules/new" 
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <span>+</span>
                <span>Créer une règle</span>
              </Link>
            </div>
          </div>

          {/* Liste des règles */}
          {loadingRules ? (
            <Card className="border-slate-800 bg-slate-900/50">
              <CardContent className="py-8">
                <div className="text-center text-slate-400">
                  Chargement des règles...
                </div>
              </CardContent>
            </Card>
          ) : rules.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900/50">
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cyan-500/10 flex items-center justify-center">
                    <TrendingUp className="w-10 h-10 text-cyan-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">
                    Crée ta première règle
                  </h3>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    Protège tes gains automatiquement. Simple comme "Vendre 50% si +60%"
                  </p>
                  <Link 
                    href="/rules/new"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    <span>+</span>
                    <span>Créer ma première règle</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <Card key={rule.id} className={`border-slate-800 ${rule.is_active ? 'bg-slate-900/50' : 'bg-slate-900/20 opacity-60'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">
                            {rule.name || `Règle ${rule.token_symbol}`}
                          </h3>
                          <span className="px-2 py-1 text-xs rounded-full bg-cyan-500/10 text-cyan-500">
                            {rule.platform}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-500">
                            {rule.token_symbol}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-slate-400">
                          {rule.take_profit_percent && (
                            <p>
                              📈 Take Profit: <span className="text-green-400">+{rule.take_profit_percent}%</span>
                            </p>
                          )}
                          {rule.stop_loss_percent && (
                            <p>
                              📉 Stop Loss: <span className="text-red-400">{rule.stop_loss_percent}%</span>
                            </p>
                          )}
                          <p>
                            💰 Vendre: <span className="text-cyan-400">{rule.sell_percent}%</span> de la position
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleRule(rule.id, rule.is_active)}
                          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                          title={rule.is_active ? 'Désactiver' : 'Activer'}
                        >
                          {rule.is_active ? (
                            <ToggleRight className="w-6 h-6 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-slate-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
