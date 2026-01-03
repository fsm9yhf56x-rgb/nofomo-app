'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, ArrowLeft, TrendingUp, AlertCircle, Wallet } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useUser } from '@/lib/hooks/useUser'
import { useAccount } from 'wagmi'
import { supabase } from '@/lib/supabase'

interface Platform {
  value: string
  label: string
  icon: string
  requiresApi?: boolean
  requiresWallet?: boolean
  chain?: string
  featured?: boolean
}

const PLATFORMS: {
  cex: Platform[]
  perp: Platform[]
} = {
  cex: [
    { value: 'binance', label: 'Binance', icon: '🟡', requiresApi: true },
    { value: 'coinbase', label: 'Coinbase', icon: '🔵', requiresApi: true },
    { value: 'kraken', label: 'Kraken', icon: '🟣', requiresApi: true },
    { value: 'bybit', label: 'Bybit', icon: '🟠', requiresApi: true },
    { value: 'kucoin', label: 'KuCoin', icon: '🟢', requiresApi: true },
  ],
  perp: [
    { value: 'hyperliquid', label: 'Hyperliquid', icon: '🔷', chain: 'Arbitrum', requiresWallet: true, featured: true },
  ]
}

export default function NewRulePage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const { address, isConnected } = useAccount()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'cex' | 'perp'>('perp')
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [loadingPrice, setLoadingPrice] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    tokenSymbol: '',
    platform: 'hyperliquid',
    entryPrice: '',
    takeProfitPercent: '',
    stopLossPercent: '',
    sellPercent: '100'
  })

  if (!loading && !user) {
    router.push('/login')
    return null
  }

  const selectedPlatform = [...PLATFORMS.cex, ...PLATFORMS.perp].find(
    p => p.value === formData.platform
  )

  useEffect(() => {
    const fetchPrice = async () => {
      if (!formData.tokenSymbol || formData.tokenSymbol.length < 2) return
      
      setLoadingPrice(true)
      try {
        const coinMap: { [key: string]: string } = {
          'BTC': 'bitcoin',
          'ETH': 'ethereum',
          'SOL': 'solana',
          'AVAX': 'avalanche-2',
        }
        
        const coinId = coinMap[formData.tokenSymbol.toUpperCase()] || formData.tokenSymbol.toLowerCase()
        
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
        )
        const data = await response.json()
        const price = data[coinId]?.usd
        
        if (price) {
          setCurrentPrice(price)
          setFormData(prev => ({ ...prev, entryPrice: price.toString() }))
        }
      } catch (err) {
        console.error('Erreur récupération prix:', err)
      } finally {
        setLoadingPrice(false)
      }
    }

    const timeoutId = setTimeout(fetchPrice, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.tokenSymbol])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCreating(true)

    try {
      if (!formData.takeProfitPercent && !formData.stopLossPercent) {
        throw new Error('Tu dois définir au moins un Take Profit ou un Stop Loss')
      }

      if (selectedPlatform?.requiresWallet && !isConnected) {
        throw new Error('Tu dois connecter ton wallet pour utiliser Hyperliquid')
      }

      if (!formData.entryPrice) {
        throw new Error('Le prix d\'entrée est requis')
      }

      const { data, error } = await supabase
        .from('trading_rules')
        .insert({
          user_id: user?.id,
          rule_name: formData.name,
          token_symbol: formData.tokenSymbol.toUpperCase(),
          platform: formData.platform,
          entry_price: parseFloat(formData.entryPrice),
          take_profit_percent: formData.takeProfitPercent ? parseFloat(formData.takeProfitPercent) : null,
          stop_loss_percent: formData.stopLossPercent ? parseFloat(formData.stopLossPercent) : null,
          sell_percent: parseFloat(formData.sellPercent),
          wallet_address: selectedPlatform?.requiresWallet ? address : null,
          is_active: true
        })
        .select()

      if (error) throw error

      router.push('/dashboard?success=rule-created')
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la règle')
    } finally {
      setCreating(false)
    }
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <nav className="fixed top-0 w-full z-50 glass border-b border-slate-800 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-cyan-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                NoFOMO
              </span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au dashboard</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Créer une règle de protection
            </h1>
            <p className="text-slate-400 text-lg">
              Choisis ta plateforme et définis ta stratégie
            </p>
          </div>

          <div className="mb-8">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setSelectedCategory('cex')
                  setFormData({ ...formData, platform: 'binance' })
                }}
                className={`p-6 rounded-lg border transition-all ${
                  selectedCategory === 'cex'
                    ? 'border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/20'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="text-3xl mb-3">🏦</div>
                <div className="font-semibold mb-1 text-lg">CEX</div>
                <div className="text-sm text-slate-400">Binance, Coinbase, Kraken...</div>
                <div className="text-xs text-orange-400 mt-2">🔑 API requise</div>
              </button>

              <button
                onClick={() => {
                  setSelectedCategory('perp')
                  setFormData({ ...formData, platform: 'hyperliquid' })
                }}
                className={`p-6 rounded-lg border transition-all ${
                  selectedCategory === 'perp'
                    ? 'border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/20'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="text-3xl mb-3">📊</div>
                <div className="font-semibold mb-1 text-lg">Perp DEX</div>
                <div className="text-sm text-slate-400">Hyperliquid</div>
                <div className="text-xs text-blue-400 mt-2">👛 Wallet requis</div>
              </button>
            </div>
          </div>

          {selectedCategory === 'perp' && !isConnected && (
            <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-start gap-3">
              <Wallet className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-400 mb-1">
                  Wallet requis pour Hyperliquid
                </p>
                <p className="text-sm text-slate-300">
                  Connecte ton wallet en haut à droite pour créer une règle sur Hyperliquid.
                </p>
              </div>
            </div>
          )}

          {selectedCategory === 'cex' && (
            <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-400 mb-1">
                  Configuration API à venir
                </p>
                <p className="text-sm text-slate-300">
                  Tu pourras connecter ton compte {formData.platform.charAt(0).toUpperCase() + formData.platform.slice(1)} via API dans une prochaine version.
                </p>
              </div>
            </div>
          )}

          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-500" />
                Configuration de la règle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-3">
                    Plateforme <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {PLATFORMS[selectedCategory].map((platform) => (
                      <button
                        key={platform.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, platform: platform.value })}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          formData.platform === platform.value
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        } ${platform.featured ? 'ring-2 ring-cyan-500/20' : ''}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{platform.icon}</span>
                          <span className="font-semibold">{platform.label}</span>
                          {platform.featured && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500 text-white">
                              ⭐
                            </span>
                          )}
                        </div>
                        {platform.chain && (
                          <div className="text-xs text-slate-400">{platform.chain}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Nom de la règle (optionnel)
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ex: Protection ETH +50%"
                  />
                </div>

                <div>
                  <label htmlFor="token" className="block text-sm font-medium mb-2">
                    Token <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="token"
                    type="text"
                    required
                    value={formData.tokenSymbol}
                    onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="ETH, BTC, SOL..."
                  />
                  {loadingPrice && (
                    <p className="text-xs text-cyan-400 mt-1">
                      🔍 Récupération du prix...
                    </p>
                  )}
                  {currentPrice && !loadingPrice && (
                    <p className="text-xs text-green-400 mt-1">
                      💰 Prix actuel: ${currentPrice.toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="entryPrice" className="block text-sm font-medium mb-2">
                    Prix d'entrée ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="entryPrice"
                    type="number"
                    step="0.01"
                    required
                    value={formData.entryPrice}
                    onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ex: 2300"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Le prix auquel tu as acheté (auto-rempli)
                  </p>
                </div>

                <div>
                  <label htmlFor="takeProfit" className="block text-sm font-medium mb-2">
                    Take Profit (%)
                  </label>
                  <input
                    id="takeProfit"
                    type="number"
                    step="0.1"
                    value={formData.takeProfitPercent}
                    onChange={(e) => setFormData({ ...formData, takeProfitPercent: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ex: 50 (pour +50%)"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Vendre si le prix monte de X%
                  </p>
                </div>

                <div>
                  <label htmlFor="stopLoss" className="block text-sm font-medium mb-2">
                    Stop Loss (%)
                  </label>
                  <input
                    id="stopLoss"
                    type="number"
                    step="0.1"
                    value={formData.stopLossPercent}
                    onChange={(e) => setFormData({ ...formData, stopLossPercent: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ex: -10 (pour -10%)"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Vendre si le prix descend de X%
                  </p>
                </div>

                <div>
                  <label htmlFor="sellPercent" className="block text-sm font-medium mb-2">
                    Quantité à vendre (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sellPercent"
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    required
                    value={formData.sellPercent}
                    onChange={(e) => setFormData({ ...formData, sellPercent: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="100"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    100% = Tout vendre | 50% = Vendre la moitié
                  </p>
                </div>

                {formData.takeProfitPercent && formData.tokenSymbol && formData.entryPrice && (
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                    <p className="text-sm text-cyan-400 font-medium mb-1">
                      📋 Aperçu de ta règle :
                    </p>
                    <p className="text-sm text-slate-300">
                      Si <span className="font-semibold">{formData.tokenSymbol.toUpperCase()}</span> monte de{' '}
                      <span className="text-green-400 font-semibold">+{formData.takeProfitPercent}%</span>
                      {' '}(prix cible: ${(parseFloat(formData.entryPrice) * (1 + parseFloat(formData.takeProfitPercent) / 100)).toFixed(2)})
                      {', '}vendre{' '}
                      <span className="text-cyan-400 font-semibold">{formData.sellPercent}%</span> de ma position
                      {selectedPlatform && ` sur ${selectedPlatform.label}`}.
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Link 
                    href="/dashboard"
                    className="flex-1 px-6 py-3 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors text-center"
                  >
                    Annuler
                  </Link>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={creating || (selectedCategory === 'perp' && !isConnected)}
                  >
                    {creating ? 'Création...' : 'Créer la règle'}
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
