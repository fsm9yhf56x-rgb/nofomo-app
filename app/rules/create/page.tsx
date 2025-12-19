'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Shield, ArrowLeft, AlertCircle, TrendingUp, TrendingDown, Target } from 'lucide-react'
import Link from 'next/link'

export default function CreateRulePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [exchanges, setExchanges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    ruleName: '',
    tokenSymbol: 'BTCUSDT',
    ruleType: 'take_profit',
    triggerType: 'percent_profit',
    triggerValue: '',
    sellPercent: '100',
    entryPrice: '',
    exchangeConnectionId: ''
  })

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }
    
    setUser(user)

    // Get user's exchange connections
    const { data: exchangeData } = await supabase
      .from('exchange_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (!exchangeData || exchangeData.length === 0) {
      router.push('/connect-exchange')
      return
    }

    setExchanges(exchangeData)
    setFormData(prev => ({ ...prev, exchangeConnectionId: exchangeData[0].id }))
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // Validation
      if (!formData.triggerValue || parseFloat(formData.triggerValue) <= 0) {
        throw new Error('La valeur du déclencheur doit être supérieure à 0')
      }

      const { error: insertError } = await supabase
        .from('trading_rules')
        .insert({
          user_id: user.id,
          exchange_connection_id: formData.exchangeConnectionId,
          rule_name: formData.ruleName,
          token_symbol: formData.tokenSymbol,
          rule_type: formData.ruleType,
          trigger_type: formData.triggerType,
          trigger_value: parseFloat(formData.triggerValue),
          sell_percent: parseFloat(formData.sellPercent),
          entry_price: formData.entryPrice ? parseFloat(formData.entryPrice) : null,
          is_active: true
        })

      if (insertError) throw insertError

      // Success! Redirect to dashboard
      router.push('/dashboard?rule_created=true')
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la règle')
    } finally {
      setSaving(false)
    }
  }

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

  const ruleTypes = [
    { value: 'take_profit', label: 'Take Profit', icon: TrendingUp, desc: 'Vendre quand en gain', color: 'green' },
    { value: 'stop_loss', label: 'Stop Loss', icon: TrendingDown, desc: 'Vendre quand en perte', color: 'red' },
    { value: 'price_target', label: 'Prix Cible', icon: Target, desc: 'Vendre à un prix précis', color: 'blue' }
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-cyan-500" />
              <span className="text-2xl font-bold gradient-text">NoFOMO</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back button */}
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au dashboard</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Crée ta première règle 🎯
            </h1>
            <p className="text-slate-400 text-lg">
              Protection automatique de tes gains. Simple et efficace.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configuration de la règle</CardTitle>
              <CardDescription>
                Définis quand et comment NoFOMO doit protéger tes gains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Rule Name */}
                <div>
                  <label htmlFor="ruleName" className="block text-sm font-medium mb-2">
                    Nom de la règle
                  </label>
                  <input
                    id="ruleName"
                    type="text"
                    required
                    value={formData.ruleName}
                    onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ex: Protection BTC +50%"
                  />
                </div>

                {/* Token */}
                <div>
                  <label htmlFor="tokenSymbol" className="block text-sm font-medium mb-2">
                    Token / Paire
                  </label>
                  <select
                    id="tokenSymbol"
                    value={formData.tokenSymbol}
                    onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="BTCUSDT">BTC/USDT</option>
                    <option value="ETHUSDT">ETH/USDT</option>
                    <option value="SOLUSDT">SOL/USDT</option>
                    <option value="BNBUSDT">BNB/USDT</option>
                    <option value="ADAUSDT">ADA/USDT</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Plus de tokens disponibles après validation du MVP
                  </p>
                </div>

                {/* Rule Type */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Type de protection
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {ruleTypes.map((type) => {
                      const Icon = type.icon
                      const isSelected = formData.ruleType === type.value
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, ruleType: type.value })}
                          className={`
                            p-4 rounded-lg border-2 transition-all text-left
                            ${isSelected 
                              ? 'border-cyan-500 bg-cyan-500/10' 
                              : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                            }
                          `}
                        >
                          <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-cyan-500' : 'text-slate-400'}`} />
                          <div className="font-semibold mb-1">{type.label}</div>
                          <div className="text-xs text-slate-400">{type.desc}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Trigger Configuration */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium">
                    Déclenchement
                  </label>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Trigger Value */}
                    <div>
                      <label htmlFor="triggerValue" className="block text-sm text-slate-400 mb-2">
                        {formData.ruleType === 'price_target' ? 'Prix cible ($)' : 'Pourcentage (%)'}
                      </label>
                      <input
                        id="triggerValue"
                        type="number"
                        step="0.01"
                        required
                        value={formData.triggerValue}
                        onChange={(e) => setFormData({ ...formData, triggerValue: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder={formData.ruleType === 'price_target' ? '45000' : '50'}
                      />
                    </div>

                    {/* Sell Percent */}
                    <div>
                      <label htmlFor="sellPercent" className="block text-sm text-slate-400 mb-2">
                        Quantité à vendre (%)
                      </label>
                      <input
                        id="sellPercent"
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={formData.sellPercent}
                        onChange={(e) => setFormData({ ...formData, sellPercent: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  {/* Entry Price (optional) */}
                  <div>
                    <label htmlFor="entryPrice" className="block text-sm text-slate-400 mb-2">
                      Prix d&apos;entrée (optionnel)
                    </label>
                    <input
                      id="entryPrice"
                      type="number"
                      step="0.01"
                      value={formData.entryPrice}
                      onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Ex: 40000 (pour calculer le gain %)"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <div className="font-semibold mb-2 text-cyan-400">📝 Résumé</div>
                  <p className="text-sm text-slate-300">
                    {formData.ruleType === 'take_profit' && 
                      `Vendre ${formData.sellPercent}% de ${formData.tokenSymbol.replace('USDT', '')} si profit de +${formData.triggerValue}%`
                    }
                    {formData.ruleType === 'stop_loss' && 
                      `Vendre ${formData.sellPercent}% de ${formData.tokenSymbol.replace('USDT', '')} si perte de -${formData.triggerValue}%`
                    }
                    {formData.ruleType === 'price_target' && 
                      `Vendre ${formData.sellPercent}% de ${formData.tokenSymbol.replace('USDT', '')} si le prix atteint $${formData.triggerValue}`
                    }
                  </p>
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                  <Link href="/dashboard" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Annuler
                    </Button>
                  </Link>
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving ? 'Création...' : 'Créer la règle'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
