import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Prix en cache (pour éviter trop d'appels API)
const priceCache = new Map<string, { price: number; timestamp: number }>()
const CACHE_DURATION = 60000 // 1 minute

async function getTokenPrice(symbol: string, platform: string): Promise<number> {
  const cacheKey = `${platform}:${symbol}`
  const cached = priceCache.get(cacheKey)
  
  // Utiliser le cache si récent
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price
  }

  try {
    let price = 0

    if (platform === 'hyperliquid') {
      // API Hyperliquid pour récupérer le prix
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'allMids'
        })
      })
      
      const data = await response.json()
      // Les prix sont dans un objet avec les symboles comme clés
      price = parseFloat(data[symbol] || '0')
    } 
    else if (['binance', 'coinbase', 'kraken', 'bybit', 'kucoin'].includes(platform)) {
      // Pour les CEX, utiliser CoinGecko comme source commune
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${getCoinGeckoId(symbol)}&vs_currencies=usd`
      )
      const data = await response.json()
      const coinId = getCoinGeckoId(symbol)
      price = data[coinId]?.usd || 0
    }

    // Mettre en cache
    priceCache.set(cacheKey, { price, timestamp: Date.now() })
    return price
  } catch (error) {
    console.error(`Erreur récupération prix ${symbol} sur ${platform}:`, error)
    return 0
  }
}

function getCoinGeckoId(symbol: string): string {
  const mapping: { [key: string]: string } = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'AVAX': 'avalanche-2',
    'MATIC': 'matic-network',
    'ARB': 'arbitrum',
    'OP': 'optimism',
  }
  return mapping[symbol.toUpperCase()] || symbol.toLowerCase()
}

export async function GET(request: Request) {
  try {
    console.log('🔍 Démarrage surveillance...')

    // 1. Récupérer toutes les règles actives
    const { data: rules, error: rulesError } = await supabase
      .from('trading_rules')
      .select('*')
      .eq('is_active', true)
      .is('executed_at', null)

    if (rulesError) throw rulesError

    if (!rules || rules.length === 0) {
      return NextResponse.json({ 
        message: 'Aucune règle active à surveiller',
        checked: 0 
      })
    }

    console.log(`📊 ${rules.length} règle(s) à vérifier`)

    const results = []

    // 2. Pour chaque règle, vérifier les conditions
    for (const rule of rules) {
      try {
        // Récupérer le prix actuel
        const currentPrice = await getTokenPrice(rule.token_symbol, rule.platform)
        
        if (currentPrice === 0) {
          console.log(`⚠️ Prix non disponible pour ${rule.token_symbol} sur ${rule.platform}`)
          continue
        }

        console.log(`💰 ${rule.token_symbol}: $${currentPrice}`)

        // TODO: Calculer le prix d'entrée (à stocker lors de la création de la règle)
        // Pour l'instant, on simule avec un prix fictif
        const entryPrice = currentPrice * 0.9 // Simulation: prix d'entrée = -10%
        const priceChange = ((currentPrice - entryPrice) / entryPrice) * 100

        console.log(`📈 ${rule.token_symbol}: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`)

        let triggered = false
        let triggerReason = ''

        // Vérifier Take Profit
        if (rule.take_profit_percent && priceChange >= rule.take_profit_percent) {
          triggered = true
          triggerReason = `Take Profit: ${priceChange.toFixed(2)}% >= ${rule.take_profit_percent}%`
        }

        // Vérifier Stop Loss
        if (rule.stop_loss_percent && priceChange <= rule.stop_loss_percent) {
          triggered = true
          triggerReason = `Stop Loss: ${priceChange.toFixed(2)}% <= ${rule.stop_loss_percent}%`
        }

        if (triggered) {
          console.log(`🚨 RÈGLE DÉCLENCHÉE: ${rule.name || rule.token_symbol}`)
          console.log(`   Raison: ${triggerReason}`)

          // Marquer la règle comme exécutée
          await supabase
            .from('trading_rules')
            .update({ 
              executed_at: new Date().toISOString(),
              is_active: false 
            })
            .eq('id', rule.id)

          // TODO: Exécuter l'ordre réel (vendre sur la plateforme)
          // Pour l'instant, on log juste
          
          results.push({
            rule: rule.name || rule.token_symbol,
            platform: rule.platform,
            token: rule.token_symbol,
            triggered: true,
            reason: triggerReason,
            currentPrice,
            priceChange: `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`
          })
        } else {
          results.push({
            rule: rule.name || rule.token_symbol,
            platform: rule.platform,
            token: rule.token_symbol,
            triggered: false,
            currentPrice,
            priceChange: `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`
          })
        }
      } catch (error) {
        console.error(`Erreur traitement règle ${rule.id}:`, error)
      }
    }

    const triggeredCount = results.filter(r => r.triggered).length

    return NextResponse.json({
      message: `Surveillance terminée: ${triggeredCount} règle(s) déclenchée(s)`,
      checked: rules.length,
      triggered: triggeredCount,
      results
    })
  } catch (error: any) {
    console.error('❌ Erreur surveillance:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
