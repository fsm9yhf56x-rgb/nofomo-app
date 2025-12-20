'use client'

import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Shield, Wallet, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function TestHyperliquidPage() {
  const { address, isConnected } = useAccount()
  const [positions, setPositions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchHyperliquidPositions = async () => {
    if (!address) return
    
    setLoading(true)
    try {
      // TODO: Appel API Hyperliquid pour récupérer les positions
      // Pour l'instant, mock data
      const mockPositions = [
        {
          coin: 'ETH',
          size: '2.5',
          entryPrice: '2300',
          markPrice: '2350',
          pnl: '+125',
          pnlPercent: '+2.17%'
        },
        {
          coin: 'BTC',
          size: '0.1',
          entryPrice: '42000',
          markPrice: '43500',
          pnl: '+150',
          pnlPercent: '+3.57%'
        }
      ]
      
      setPositions(mockPositions)
    } catch (error) {
      console.error('Error fetching positions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected) {
      fetchHyperliquidPositions()
    }
  }, [isConnected, address])

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
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">Test Hyperliquid</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              🧪 Test Hyperliquid (Perp DEX)
            </h1>
            <p className="text-slate-400 text-lg">
              Proof of Concept - Connexion wallet et lecture positions
            </p>
          </div>

          {/* Wallet Connection Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Connexion Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <div className="text-center py-8">
                  <Wallet className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    Connecte ton wallet
                  </h3>
                  <p className="text-slate-400 mb-6">
                    Pour voir tes positions Hyperliquid, connecte MetaMask ou Rabby
                  </p>
                  <ConnectButton />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div>
                      <div className="text-sm text-slate-400">Wallet connecté</div>
                      <div className="font-mono text-green-400">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </div>
                    </div>
                    <ConnectButton />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Positions Card */}
          {isConnected && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Positions Hyperliquid (Mock Data)
                  </CardTitle>
                  <Button onClick={fetchHyperliquidPositions} disabled={loading}>
                    {loading ? 'Chargement...' : 'Actualiser'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {positions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    Aucune position ouverte
                  </div>
                ) : (
                  <div className="space-y-3">
                    {positions.map((pos, idx) => (
                      <div key={idx} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{pos.coin}/USD</h3>
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">
                                Perp
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-slate-400">Size: </span>
                                <span className="text-white">{pos.size}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">Entry: </span>
                                <span className="text-white">${pos.entryPrice}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">Mark: </span>
                                <span className="text-white">${pos.markPrice}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">PnL: </span>
                                <span className="text-green-500">${pos.pnl} ({pos.pnlPercent})</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {positions.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="text-sm">
                      <div className="font-semibold text-blue-400 mb-2">💡 Prochaine étape :</div>
                      <ul className="space-y-1 text-slate-400">
                        <li>• Intégrer la vraie API Hyperliquid</li>
                        <li>• Créer des règles de protection sur ces positions</li>
                        <li>• Exécuter automatiquement via smart contract</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
