import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, points } = await request.json()

    // Get or create points tracker
    let { data: tracker } = await supabase
      .from('points_tracker')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!tracker) {
      const { data: newTracker } = await supabase
        .from('points_tracker')
        .insert({ user_id: user.id, total_points: 0, activities: {} })
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
      .eq('user_id', user.id)

    // Don't return points to frontend (keep it secret)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error awarding points:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}