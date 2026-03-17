import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/scenarios
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const topic = searchParams.get('topic')
    const level = searchParams.get('level')
    const id = searchParams.get('id')

    if (id) {
      // Fetch a single scenario with all its turns ordered
      const { data, error } = await supabase
        .from('scenarios')
        .select(`
          *,
          scenario_turns (
            *
          )
        `)
        .eq('id', id)
        .order('turn_order', { referencedTable: 'scenario_turns', ascending: true })
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, scenario: data })
    }

    // Fetch a list of scenarios (optionally filtered)
    let query = supabase.from('scenarios').select('*')
    if (topic) query = query.ilike('topic', `%${topic}%`)
    if (level) query = query.eq('level', level)
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, scenarios: data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch scenarios', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
