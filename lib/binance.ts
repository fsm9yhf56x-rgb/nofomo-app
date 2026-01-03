import ccxt from 'ccxt'

// Fonction pour obtenir le prix actuel d'une crypto
export async function getCurrentPrice(symbol: string): Promise<number> {
  try {
    // Créer une instance Binance (pas besoin de clés pour les prix publics)
    const exchange = new ccxt.binance({
      enableRateLimit: true
    })
    
    // Convertir BTCUSDT -> BTC/USDT (format CCXT)
    const formattedSymbol = symbol.includes('/') 
      ? symbol 
      : symbol.replace('USDT', '/USDT')
    
    // Récupérer le ticker
    const ticker = await exchange.fetchTicker(formattedSymbol)
    const price = ticker.last
    
    if (!price) {
      throw new Error(`Prix non disponible pour ${symbol}`)
    }
    
    console.log(`💰 Prix ${symbol} (via CCXT): $${price}`)
    return price
    
  } catch (error: any) {
    console.error(`❌ Erreur prix ${symbol} (CCXT):`, error.message)
    throw error
  }
}

// Fonction pour exécuter un ordre de vente
export async function executeSellOrder(
  apiKey: string,
  apiSecret: string,
  symbol: string,
  quantity: number
): Promise<any> {
  try {
    // Créer une instance Binance avec authentification
    const exchange = new ccxt.binance({
      apiKey: apiKey,
      secret: apiSecret,
      enableRateLimit: true
    })
    
    // Convertir BTCUSDT -> BTC/USDT
    const formattedSymbol = symbol.includes('/') 
      ? symbol 
      : symbol.replace('USDT', '/USDT')
    
    // Créer un ordre de vente au marché
    const order = await exchange.createMarketSellOrder(formattedSymbol, quantity)
    
    console.log(`✅ Ordre de vente exécuté (CCXT):`, order)
    return order
    
  } catch (error: any) {
    console.error(`❌ Erreur exécution ordre (CCXT):`, error.message)
    throw error
  }
}

// Fonction pour récupérer le solde d'un token
export async function getTokenBalance(
  apiKey: string,
  apiSecret: string,
  symbol: string
): Promise<number> {
  try {
    const exchange = new ccxt.binance({
      apiKey: apiKey,
      secret: apiSecret,
      enableRateLimit: true
    })
    
    const balance = await exchange.fetchBalance()
    
    // Extraire le symbole (BTC de BTCUSDT)
    const asset = symbol.replace('USDT', '').replace('/', '')
    
    const free = balance.free[asset] || 0
    
    console.log(`💼 Balance ${asset} (CCXT): ${free}`)
    return free
    
  } catch (error: any) {
    console.error(`❌ Erreur récupération balance (CCXT):`, error.message)
    return 0
  }
}

// Fonction utilitaire pour créer une signature (gardée pour compatibilité)
export function createSignature(queryString: string, apiSecret: string): string {
  const crypto = require('crypto')
  return crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex')
}