import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('study_entries')
    .select('id, english_term, amharic_term')
    .order('id', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const toDelete: string[] = []
  const seen = new Set<string>()

  for (const row of data) {
    // Delete if no Amharic term
    if (!row.amharic_term || row.amharic_term.trim().length < 2) {
      toDelete.push(row.id); continue
    }
    // Delete duplicates (keep first/most recent id)
    const key = `${row.english_term?.toLowerCase().trim()}|${row.amharic_term?.toLowerCase().trim()}`
    if (seen.has(key)) toDelete.push(row.id)
    else seen.add(key)
  }

  if (toDelete.length === 0) {
    return NextResponse.json({ message: 'Already clean! No entries removed.', total: data.length })
  }

  for (let i = 0; i < toDelete.length; i += 50) {
    await supabase.from('study_entries').delete().in('id', toDelete.slice(i, i + 50))
  }

  return NextResponse.json({
    message: `Cleanup complete!`,
    removed: toDelete.length,
    remaining: data.length - toDelete.length,
  })
}
