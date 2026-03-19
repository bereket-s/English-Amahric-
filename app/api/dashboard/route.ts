import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function toDateKey(dateValue: string) {
  return new Date(dateValue).toISOString().slice(0, 10)
}

function calculateStreak(dates: string[]) {
  if (dates.length === 0) return 0

  const uniqueDates = [...new Set(dates.map(toDateKey))].sort().reverse()

  let streak = 1

  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = new Date(uniqueDates[i] + 'T00:00:00Z')
    const next = new Date(uniqueDates[i + 1] + 'T00:00:00Z')

    const diffDays = Math.round(
      (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}

export async function GET() {
  try {
    const { data: attempts, error } = await supabase
      .from('user_term_attempts')
      .select(`
        id,
        spoken_text,
        correctness_score,
        feedback_json,
        created_at,
        study_entry_id
      `)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      return NextResponse.json(
        {
          error: 'Failed to load dashboard data.',
          details: error.message,
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

    const totalAttempts = mergedAttempts.length
    const averageScore =
      totalAttempts > 0
        ? Math.round(
            mergedAttempts.reduce(
              (sum, item) => sum + (item.correctness_score || 0),
              0
            ) / totalAttempts
          )
        : 0

    const exactMatches = mergedAttempts.filter(
      (item) => item.feedback_json?.status === 'Exact match'
    ).length

    const termAttempts = mergedAttempts.filter(
      (item) => (item.feedback_json?.practice_type || 'term') === 'term'
    ).length

    const sentenceAttempts = mergedAttempts.filter(
      (item) => item.feedback_json?.practice_type === 'sentence'
    ).length

    const streak = calculateStreak(
      mergedAttempts
        .map((item) => item.created_at)
        .filter((value): value is string => Boolean(value))
    )

    const recentTerms = mergedAttempts.slice(0, 10).map((item) => ({
      id: item.id,
      english_term: item.study_entries?.english_term || '-',
      amharic_term: item.study_entries?.amharic_term || '-',
      score: item.correctness_score || 0,
      status: item.feedback_json?.status || '-',
      practice_type: item.feedback_json?.practice_type || 'term',
      created_at: item.created_at || null,
    }))

    // Smart Review Logic (MVP): Lowest scores from the unique terms attempted
    const latestAttemptPerTerm = new Map<string, any>()
    for (const attempt of mergedAttempts) {
      if (attempt.study_entry_id && !latestAttemptPerTerm.has(attempt.study_entry_id)) {
        latestAttemptPerTerm.set(attempt.study_entry_id, attempt)
      }
    }
    
    const smartReviewTerms = Array.from(latestAttemptPerTerm.values())
      .filter(item => (item.correctness_score || 0) < 85)
      .sort((a, b) => (a.correctness_score || 0) - (b.correctness_score || 0))
      .slice(0, 5)
      .map(item => ({
        id: item.study_entry_id, // We'll link to the study entry, not the attempt ID here ideally, but for now we map it similar
        english_term: item.study_entries?.english_term || '-',
        amharic_term: item.study_entries?.amharic_term || '-',
        score: item.correctness_score || 0,
      }))

    return NextResponse.json({
      success: true,
      summary: {
        totalAttempts,
        termAttempts,
        sentenceAttempts,
        averageScore,
        exactMatches,
        streak,
      },
      recentTerms,
      smartReviewTerms,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to load dashboard data.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
