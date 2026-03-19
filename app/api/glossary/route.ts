import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const level = (searchParams.get('level') || '').trim()
    const topic = (searchParams.get('topic') || '').trim()

    let query = supabase
      .from('study_entries')
      .select('*')
      .not('amharic_term', 'is', null)
      .neq('amharic_term', '')
      .order('english_term', { ascending: true })

    if (q) {
      query = query.or(
        `english_term.ilike.%${q}%,amharic_term.ilike.%${q}%,definition.ilike.%${q}%`
      )
    }

    if (level) {
      query = query.eq('level', level)
    }

    if (topic) {
      query = query.ilike('topic', `%${topic}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to load glossary.', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      entries: data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Glossary request failed.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
