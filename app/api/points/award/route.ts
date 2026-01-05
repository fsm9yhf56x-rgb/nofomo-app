import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { action, points, wallet_address } = await request.json()
    
    if (!wallet_address) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    // Get or create points tracker
    let { data: tracker } = await supabase
      .from('points_tracker')
      .select('*')
      .eq('wallet_address', wallet_address)
      .single()

    if (!tracker) {
      const { data: newTracker } = await supabase
        .from('points_tracker')
        .insert({ 
          wallet_address: wallet_address,
          total_points: 0, 
          activities: {} 
        })
        .select()
        .single()
      tracker = newTracker
    }

    // Update points (invisible to user)
    const activities = tracker.activities || {}
    activities[action] = (activities[action] || 0) + points

    await supabase
      .from('points_tracker')
      .update({
        total_points: tracker.total_points + points,
        activities: activities,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', wallet_address)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error awarding points:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}