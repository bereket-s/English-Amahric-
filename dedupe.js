const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function deduplicate() {
  console.log('Fetching all entries...')
  const { data, error } = await supabase.from('study_entries').select('id, english_term, amharic_term').order('id', { ascending: false })
  
  if (error) {
    console.error('Error fetching data:', error)
    return
  }

  const seen = new Set()
  const toDelete = []

  // Keep the most recent (highest ID), delete older ones
  for (const row of data) {
    const key = `${row.english_term?.toLowerCase().trim()}|${row.amharic_term?.toLowerCase().trim()}`
    if (seen.has(key)) {
      toDelete.push(row.id)
    } else {
      seen.add(key)
    }
  }

  console.log(`Found ${toDelete.length} duplicates out of ${data.length} total entries.`)

  if (toDelete.length > 0) {
    // Delete in batches of 50
    for(let i = 0; i < toDelete.length; i += 50) {
      const batch = toDelete.slice(i, i + 50)
      console.log(`Deleting batch of ${batch.length}...`)
      const { error: delErr } = await supabase.from('study_entries').delete().in('id', batch)
      if (delErr) {
        console.error('Error deleting:', delErr)
      }
    }
    console.log('Deduplication complete!')
  }
}

deduplicate()
