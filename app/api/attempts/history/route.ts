import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: attempts, error: attemptsError } = await supabase
      .from('user_term_attempts')
      .select(`
        id,
        study_entry_id,
        spoken_text,
        correctness_score,
        pronunciation_score,
        feedback_json,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (attemptsError) {
      return NextResponse.json(
        {
          error: 'Failed to load attempt history.',
          details: attemptsError.message,
        },
        { status: 500 }
      )
    }

    const studyEntryIds = [
      ...new Set((attempts || []).map((a) => a.study_entry_id).filter(Boolean)),
    ]

    let entriesMap: Record<string, any> = {}

    if (studyEntryIds.length > 0) {
      const { data: entries, error: entriesError } = await supabase
        .from('study_entries')
        .select('id, english_term, amharic_term, level, topic')
        .in('id', studyEntryIds)

      if (entriesError) {
        return NextResponse.json(
          {
            error: 'Failed to load related study entries.',
            details: entriesError.message,
          },
          { status: 500 }
        )
      }

      entriesMap = Object.fromEntries(
        (entries || []).map((entry) => [entry.id, entry])
      )
    }

    const mergedAttempts = (attempts || []).map((attempt) => ({
      ...attempt,
      study_entries: attempt.study_entry_id
        ? entriesMap[attempt.study_entry_id] || null
        : null,
    }))

    return NextResponse.json({
      success: true,
      attempts: mergedAttempts,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to load attempt history.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
