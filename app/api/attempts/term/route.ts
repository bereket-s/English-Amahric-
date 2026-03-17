import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      study_entry_id,
      spoken_text,
      correctness_score,
      expected_term,
      status,
      practice_type,
      ai_feedback,
    } = body

    if (!study_entry_id) {
      return NextResponse.json(
        { error: 'study_entry_id is required.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('user_term_attempts')
      .insert({
        user_id: null,
        study_entry_id,
        spoken_text: spoken_text || null,
        pronunciation_score: correctness_score || 0,
        correctness_score: correctness_score || 0,
        fluency_score: 0,
        clarity_score: 0,
        feedback_json: {
          expected_term: expected_term || '',
          status: status || '',
          practice_type: practice_type || 'term',
          ...(ai_feedback ? { ai_feedback } : {})
        },
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        {
          error: 'Failed to save term attempt.',
          details: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      attempt: data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to save term attempt.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
