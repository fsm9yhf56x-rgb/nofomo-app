import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { action, xp, wallet_address } = await request.json()
    
    if (!wallet_address) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    // Get or create user profile
    let { data: profile } = await supabase
      .from('user_profile')
      .select('*')
      .eq('wallet_address', wallet_address)
      .single()

    if (!profile) {
      const { data: newProfile } = await supabase
        .from('user_profile')
        .insert({ 
          wallet_address: wallet_address,
          xp: 0, 
          level: 1,
          streak_days: 0 
        })
        .select()
        .single()
      profile = newProfile
    }

    // Calculate new XP and level
    const newXP = profile.xp + xp
    const newLevel = Math.floor(newXP / 1000) + 1

    // Update profile
    await supabase
      .from('user_profile')
      .update({
        xp: newXP,
        level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', wallet_address)

    return NextResponse.json({ 
      success: true,
      newXP,
      newLevel,
      leveledUp: newLevel > profile.level
    })

  } catch (error) {
    console.error('Error awarding XP:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}