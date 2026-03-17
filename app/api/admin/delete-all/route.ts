import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  // Count before delete
  const { count, error: countErr } = await supabase
    .from('study_entries')
    .select('*', { count: 'exact', head: true })

  if (countErr) {
    return NextResponse.json({ error: 'Count failed: ' + countErr.message }, { status: 500 })
  }

  if (count === 0) {
    return NextResponse.json({ message: 'Already empty — no entries to delete.' })
  }

  // Fetch IDs and delete by ID to bypass any RLS issues
  const { data: ids, error: fetchErr } = await supabase
    .from('study_entries')
    .select('id')
    .limit(10000)

  if (fetchErr) {
    return NextResponse.json({ error: 'Fetch IDs failed: ' + fetchErr.message }, { status: 500 })
  }

  const idList = ids?.map((r: { id: string }) => r.id) || []

  if (idList.length === 0) {
    return NextResponse.json({ message: 'No entries found to delete.' })
  }

  // Delete in batches of 100
  let deleted = 0
  for (let i = 0; i < idList.length; i += 100) {
    const batch = idList.slice(i, i + 100)
    const { error: delErr } = await supabase
      .from('study_entries')
      .delete()
      .in('id', batch)

    if (delErr) {
      return NextResponse.json({
        error: 'Delete batch failed: ' + delErr.message,
        deletedSoFar: deleted
      }, { status: 500 })
    }
    deleted += batch.length
  }

  return NextResponse.json({
    message: `Done! Deleted all ${deleted} entries. Database is now empty.`,
    deleted,
  })
}
