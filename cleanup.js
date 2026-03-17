const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function cleanup() {
  console.log('Fetching all entries...')
  const { data, error } = await supabase
    .from('study_entries')
    .select('id, english_term, amharic_term')
    .order('id', { ascending: false })

  if (error) { console.error(error); return }
  console.log(`Total entries: ${data.length}`)

  const toDelete = []
  const seen = new Set()

  for (const row of data) {
    // Remove if no Amharic term
    if (!row.amharic_term || row.amharic_term.trim().length < 2) {
      toDelete.push(row.id)
      continue
    }
    // Remove duplicates (keep first/highest id seen)
    const key = `${row.english_term?.toLowerCase().trim()}|${row.amharic_term?.toLowerCase().trim()}`
    if (seen.has(key)) {
      toDelete.push(row.id)
    } else {
      seen.add(key)
    }
  }

  console.log(`Flagged for removal: ${toDelete.length} (${data.length - toDelete.length} will remain)`)

  if (toDelete.length === 0) { console.log('Nothing to delete.'); return }

  for (let i = 0; i < toDelete.length; i += 50) {
    const batch = toDelete.slice(i, i + 50)
    console.log(`Deleting batch ${Math.floor(i/50)+1}...`)
    const { error: delErr } = await supabase.from('study_entries').delete().in('id', batch)
    if (delErr) console.error('Batch error:', delErr.message)
  }

  console.log('Cleanup complete!')
}

cleanup()
