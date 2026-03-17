import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('study_entries')
      .select('id, english_term, amharic_term, level, topic')
      .not('english_term', 'is', null)
      .limit(500)

    if (error) {
      return NextResponse.json(
        {
          error: 'Failed to load random term.',
          details: error.message,
        },
        { status: 500 }
      )
    }

    const items = (data || []).filter((item) => item.english_term)

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No glossary terms found.' },
        { status: 404 }
      )
    }

    const randomIndex = Math.floor(Math.random() * items.length)
    const randomItem = items[randomIndex]

    return NextResponse.json({
      success: true,
      term: randomItem,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to load random term.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
