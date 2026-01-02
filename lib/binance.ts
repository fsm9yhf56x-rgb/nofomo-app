import crypto from 'crypto'
import axios from 'axios'

const BINANCE_API_URL = process.env.BINANCE_API_URL || 'https://api.binance.com/api'

export async function getCurrentPrice(symbol: string): Promise<number> {
  try {
    const response = await axios.get(`${BINANCE_API_URL}/v3/ticker/price`, {
      params: { symbol: symbol.toUpperCase() }
    })
    return parseFloat(response.data.price)
  } catch (error) {
    console.error(`Erreur prix ${symbol}:`, error)
    throw error
  }
}

function createSignature(queryString: string, apiSecret: string): string {
  return crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex')
}

export async function executeSellOrder(
  apiKey: string,
  apiSecret: string,
  symbol: string,
  quantity: number
): Promise<any> {
  try {
    const timestamp = Date.now()
    const params = {
      symbol: symbol.toUpperCase(),
      side: 'SELL',
      type: 'MARKET',
      quantity: quantity.toString(),
      timestamp
    }

    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')
    
    const signature = createSignature(queryString, apiSecret)

    const response = await axios.post(
      `${BINANCE_API_URL}/v3/order`,
      null,
      {
        params: { ...params, signature },
        headers: {
          'X-MBX-APIKEY': apiKey
        }
      }
    )

    return response.data
  } catch (error: any) {
    console.error('Erreur ordre de vente:', error.response?.data || error)
    throw error
  }
}

export async function getTokenBalance(
  apiKey: string,
  apiSecret: string,
  symbol: string
): Promise<number> {
  try {
    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    const signature = createSignature(queryString, apiSecret)

    const response = await axios.get(`${BINANCE_API_URL}/v3/account`, {
      params: { timestamp, signature },
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    })

    const asset = symbol.replace('USDT', '')
    const balance = response.data.balances.find((b: any) => b.asset === asset)
    
    return parseFloat(balance?.free || '0')
  } catch (error) {
    console.error(`Erreur balance ${symbol}:`, error)
    throw error
  }
}

