import { NextResponse } from 'next/server'
import { createClient } from '../../../../src/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
      .from('user_term_attempts')
      .select(`
        id,
        study_entry_id,
        correctness_score,
        feedback_json
      `)
      .limit(1000)

    if (user) {
      query = query.eq('user_id', user.id)
    } else {
      query = query.is('user_id', null)
    }

    const { data: attempts, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to load weak words.', details: error.message }, { status: 500 })
    }

    const termAttempts = (attempts || []).filter(
      (item) => (item.feedback_json?.practice_type || 'term') === 'term'
    )

    const grouped: Record<string, { study_entry_id: string; attempts: number; totalScore: number }> = {}

    for (const attempt of termAttempts) {
      if (!attempt.study_entry_id) continue
      if (!grouped[attempt.study_entry_id]) {
        grouped[attempt.study_entry_id] = { study_entry_id: attempt.study_entry_id, attempts: 0, totalScore: 0 }
      }
      grouped[attempt.study_entry_id].attempts += 1
      grouped[attempt.study_entry_id].totalScore += attempt.correctness_score || 0
    }

    const groupedList = Object.values(grouped)
    const studyEntryIds = groupedList.map((item) => item.study_entry_id)
    let entriesMap: Record<string, any> = {}

    if (studyEntryIds.length > 0) {
      const { data: entries, error: entriesError } = await supabase
        .from('study_entries')
        .select('id, english_term, amharic_term, level, topic')
        .in('id', studyEntryIds)

      if (entriesError) {
        return NextResponse.json({ error: 'Failed to load study entries.', details: entriesError.message }, { status: 500 })
      }
      entriesMap = Object.fromEntries((entries || []).map((entry) => [entry.id, entry]))
    }

    const weakWords = groupedList
      .map((item) => ({
        study_entry_id: item.study_entry_id,
        attempts: item.attempts,
        averageScore: Math.round(item.totalScore / item.attempts),
        english_term: entriesMap[item.study_entry_id]?.english_term || '-',
        amharic_term: entriesMap[item.study_entry_id]?.amharic_term || '-',
        level: entriesMap[item.study_entry_id]?.level || null,
        topic: entriesMap[item.study_entry_id]?.topic || null,
      }))
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 20)

    return NextResponse.json({ success: true, weakWords })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load weak words.', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
