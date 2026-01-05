import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, xp } = await request.json()

    // Get or create user profile
    let { data: profile } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      const { data: newProfile } = await supabase
        .from('user_profile')
        .insert({ 
          user_id: user.id, 
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
      .eq('user_id', user.id)

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