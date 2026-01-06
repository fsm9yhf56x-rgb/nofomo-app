import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { tokenPair } = await request.json()
    
    // Simple mock - en vrai on utiliserait CoinGecko API
    // Pour le MVP, on simule un pump si l'heure est impaire
    const hour = new Date().getHours()
    const isPumping = hour % 2 !== 0
    const pumpPercentage = isPumping ? 15 + Math.random() * 10 : 0
    
    return NextResponse.json({ 
      isPumping,
      pumpPercentage: Math.round(pumpPercentage * 10) / 10
    })
  } catch (error) {
    return NextResponse.json({ isPumping: false, pumpPercentage: 0 })
  }
}