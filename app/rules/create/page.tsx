'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Shield, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function CreateRulePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [exchanges, setExchanges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    tokenSymbol: '',
    ruleName: '',
    entryPrice: '',
    ruleType: 'take_profit_percent',
    triggerValue: '',
    sellPercent: '100'
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
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // Validation
      if (!formData.tokenSymbol) {
        throw new Error('Le token est requis')
      }
      if (!formData.ruleType) {
        throw new Error('Le type de règle est requis')
      }
      if (!formData.triggerValue || parseFloat(formData.triggerValue) <= 0) {
        throw new Error('La valeur de déclenchement doit être supérieure à 0')
      }
      if (!formData.sellPercent || parseFloat(formData.sellPercent) < 1 || parseFloat(formData.sellPercent) > 100) {
        throw new Error('Le pourcentage à vendre doit être entre 1 et 100%')
      }

      // Déterminer rule_type et trigger_type selon le type choisi
      let ruleType = ''
      let triggerType = ''
      
      switch (formData.ruleType) {
        case 'take_profit_percent':
          ruleType = 'take_profit'
          triggerType = 'percent_profit'
          break
        case 'stop_loss_percent':
          ruleType = 'stop_loss'
          triggerType = 'percent_loss'
          break
        case 'price_above':
          ruleType = 'price_target'
          triggerType = 'price_above'
          break
        case 'price_below':
          ruleType = 'price_target'
          triggerType = 'price_below'
          break
      }

      // Récupérer le premier exchange de l'utilisateur
      const firstExchange = exchanges[0]
      if (!firstExchange) {
        throw new Error('Aucun exchange connecté. Connecte un exchange d\'abord.')
      }

      const { error: insertError } = await supabase
        .from('trading_rules')
        .insert({
          user_id: user.id,
          exchange_connection_id: firstExchange.id,
          rule_name: formData.ruleName || 'Règle sans nom',
          token_symbol: formData.tokenSymbol.toUpperCase(),
          rule_type: ruleType,
          entry_price: formData.entryPrice ? parseFloat(formData.entryPrice) : null,
          entry_quantity: 0,
          trigger_type: triggerType,
          trigger_value: parseFloat(formData.triggerValue),
          sell_percent: parseFloat(formData.sellPercent),
          is_active: true,
          is_triggered: false
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

  const ruleTypeOptions = [
    { value: 'take_profit_percent', label: 'Take Profit (%)', desc: 'Vendre quand le profit atteint X%' },
    { value: 'stop_loss_percent', label: 'Stop Loss (%)', desc: 'Vendre quand la perte atteint X%' },
    { value: 'price_above', label: 'Prix cible au-dessus', desc: 'Vendre quand le prix dépasse X$' },
    { value: 'price_below', label: 'Prix cible en-dessous', desc: 'Vendre quand le prix descend sous X$' }
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
              Créer une règle 🎯
            </h1>
            <p className="text-slate-400 text-lg">
              Crée ta règle en 30 secondes. Simple et efficace.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configuration de la règle</CardTitle>
              <CardDescription>
                Remplis les champs ci-dessous pour créer ta règle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Token - Requis */}
                <div>
                  <label htmlFor="tokenSymbol" className="block text-sm font-medium mb-2">
                    Token <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="tokenSymbol"
                    type="text"
                    required
                    value={formData.tokenSymbol}
                    onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ex: BTCUSDT, ETH, SOL"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Format: BTCUSDT, ETH, SOL, etc.
                  </p>
                </div>

                {/* Nom de la règle - Optionnel */}
                <div>
                  <label htmlFor="ruleName" className="block text-sm font-medium mb-2">
                    Nom de la règle <span className="text-slate-500 text-xs">(optionnel)</span>
                  </label>
                  <input
                    id="ruleName"
                    type="text"
                    value={formData.ruleName}
                    onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ex: Protection BTC +50%"
                  />
                </div>

                {/* Prix d'entrée - Optionnel */}
                <div>
                  <label htmlFor="entryPrice" className="block text-sm font-medium mb-2">
                    Prix d&apos;entrée <span className="text-slate-500 text-xs">(optionnel)</span>
                  </label>
                  <input
                    id="entryPrice"
                    type="number"
                    step="0.01"
                    value={formData.entryPrice}
                    onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ex: 40000 (pour calculer le profit/perte %)"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Le prix auquel tu as acheté (pour calculer le profit/perte %)
                  </p>
                </div>

                {/* Type de règle - Requis */}
                <div>
                  <label htmlFor="ruleType" className="block text-sm font-medium mb-2">
                    Type de règle <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="ruleType"
                    required
                    value={formData.ruleType}
                    onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {ruleTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Valeur de déclenchement - Requis */}
                <div>
                  <label htmlFor="triggerValue" className="block text-sm font-medium mb-2">
                    Valeur de déclenchement <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="triggerValue"
                    type="number"
                    step="0.01"
                    required
                    value={formData.triggerValue}
                    onChange={(e) => setFormData({ ...formData, triggerValue: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder={
                      formData.ruleType === 'price_above' || formData.ruleType === 'price_below'
                        ? 'Ex: 100000 (en $)'
                        : 'Ex: 10 (en %)'
                    }
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.ruleType === 'price_above' || formData.ruleType === 'price_below'
                      ? 'Prix en dollars ($)'
                      : 'Pourcentage (%)'}
                  </p>
                </div>

                {/* Pourcentage à vendre - Requis */}
                <div>
                  <label htmlFor="sellPercent" className="block text-sm font-medium mb-2">
                    Pourcentage à vendre <span className="text-red-500">*</span>
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
                  <p className="text-xs text-slate-500 mt-1">
                    1-100% de la position à vendre (défaut: 100%)
                  </p>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
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
