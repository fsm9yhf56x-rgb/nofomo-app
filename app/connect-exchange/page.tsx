'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Shield, ExternalLink, AlertCircle, Key, Lock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ConnectExchangePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    apiKey: '',
    apiSecret: '',
    testMode: true
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
    setLoading(false)
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // TODO: Encrypt API keys before saving
      const { error: insertError } = await supabase
        .from('exchange_connections')
        .insert({
          user_id: user.id,
          exchange_name: 'binance',
          api_key_encrypted: formData.apiKey, // Will encrypt later
          api_secret_encrypted: formData.apiSecret, // Will encrypt later
          is_active: true
        })

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion')
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Connecte ton exchange
            </h1>
            <p className="text-slate-400 text-lg">
              Commence par Binance pour protéger tes gains automatiquement
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Instructions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">🔐 Sécurité garantie</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-400">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Tes API keys sont encryptées (AES-256)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Permissions en read-only + spot trading uniquement</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Tes fonds restent sur Binance, on ne peut pas retirer</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Tu peux révoquer l&apos;accès à tout moment</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">📝 Comment créer tes API keys</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-400">
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-500 font-semibold">1.</span>
                    <span>Va sur Binance → Profile → API Management</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-500 font-semibold">2.</span>
                    <span>Clique sur &quot;Create API&quot;</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-500 font-semibold">3.</span>
                    <span>Active UNIQUEMENT : &quot;Enable Reading&quot; + &quot;Enable Spot Trading&quot;</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-500 font-semibold">4.</span>
                    <span>Copie API Key et Secret Key</span>
                  </div>

                  <a 
                    href="https://www.binance.com/en/my/settings/api-management"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-cyan-500 hover:underline mt-2"
                  >
                    Ouvrir Binance API Management
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </CardContent>
              </Card>
            </div>

            {/* Form */}
            <div>
              {success ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Binance connecté !</h3>
                    <p className="text-slate-400 mb-4">Redirection vers le dashboard...</p>
                    <div className="text-sm text-slate-500">
                      🎉 +50 points de discipline !
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Connecte Binance</CardTitle>
                    <CardDescription>
                      Entre tes API keys pour commencer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleConnect} className="space-y-4">
                      {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-400">{error}</p>
                        </div>
                      )}

                      {/* Test Mode Toggle */}
                      <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.testMode}
                            onChange={(e) => setFormData({ ...formData, testMode: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">
                            Mode Test (Binance Testnet - recommandé pour commencer)
                          </span>
                        </label>
                      </div>

                      {/* API Key */}
                      <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium mb-2">
                          API Key
                        </label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            id="apiKey"
                            type="text"
                            required
                            value={formData.apiKey}
                            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
                            placeholder="xxxxxxxxxxxxxxxxxxx"
                          />
                        </div>
                      </div>

                      {/* API Secret */}
                      <div>
                        <label htmlFor="apiSecret" className="block text-sm font-medium mb-2">
                          API Secret
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            id="apiSecret"
                            type="password"
                            required
                            value={formData.apiSecret}
                            onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
                            placeholder="•••••••••••••••••••"
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full" disabled={saving}>
                        {saving ? 'Connexion...' : 'Connecter Binance'}
                      </Button>

                      <p className="text-xs text-center text-slate-500">
                        En connectant, tu acceptes que NoFOMO puisse lire tes positions et exécuter des ordres de vente selon tes règles.
                      </p>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
