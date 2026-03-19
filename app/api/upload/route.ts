import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parsePdfFile } from '../../../src/lib/parsers/pdf'
import { parseTxtFile } from '../../../src/lib/parsers/txt'
import { parseDocxFile } from '../../../src/lib/parsers/docx'
import { parseCsvFile } from '../../../src/lib/parsers/csv'
import { parseJsonFile } from '../../../src/lib/parsers/json'
import { extractGlossaryEntriesFromText, extractScenariosFromText } from '../../../src/lib/parsers/extractor'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const level = (formData.get('level') as string | null)?.trim() || null
    const topic = (formData.get('topic') as string | null)?.trim() || null

    // Read upload type from formData field (most reliable) or query param
    let uploadType = (formData.get('uploadType') as string | null) || 'glossary'
    try {
      const url = new URL(request.url, 'http://localhost')
      const typeParam = url.searchParams.get('type')
      if (typeParam) uploadType = typeParam
    } catch { /* ignore URL parse errors */ }


    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded.' },
        { status: 400 }
      )
    }

    const { data: sourceData, error: sourceError } = await supabase
      .from('study_sources')
      .insert({
        file_name: file.name,
        file_type: file.type || 'unknown',
        parse_status: 'pending',
      })
      .select()
      .single()

    if (sourceError) {
      return NextResponse.json(
        {
          error: 'Failed to save upload metadata.',
          details: sourceError.message,
        },
        { status: 500 }
      )
    }

    let parsePreview: string | null = null
    let parsePages: number | null = null
    let extractedEntriesCount = 0
    let extractedEntriesPreview: unknown[] = []
    let savedEntriesCount = 0
    let insertDebug: unknown = null
    let parsedText = ''

    const saveParsedEntries = async (entries: Array<{
      english_term: string
      amharic_term?: string | null
      definition?: string | null
      english_sentence?: string | null
      amharic_sentence?: string | null
      level?: string | null
      topic?: string | null
      tags?: string[]
    }>) => {
      // 1. Filter out entries without an Amharic term
      const withAmharic = entries.filter(e => e.amharic_term && e.amharic_term.trim().length > 1)

      extractedEntriesCount = withAmharic.length
      extractedEntriesPreview = withAmharic.slice(0, 5)

      if (withAmharic.length === 0) return

      // 2. Deduplicate: fetch all existing english_terms from the DB
      const { data: existingEntries } = await supabase
        .from('study_entries')
        .select('english_term')

      const existingTerms = new Set(
        (existingEntries || []).map((e: { english_term: string }) =>
          e.english_term?.toLowerCase().trim()
        )
      )

      // 3. Only keep entries whose english_term is not already in the DB
      const newEntries = withAmharic.filter(
        e => !existingTerms.has(e.english_term?.toLowerCase().trim())
      )

      if (newEntries.length === 0) {
        savedEntriesCount = 0
        insertDebug = { skippedAllAsDuplicates: true, checkedCount: withAmharic.length }
        return
      }

      const rows = newEntries.map((entry) => ({
        source_id: sourceData.id,
        // Prefer AI-detected per-entry level/topic, fall back to values from the upload form
        level: entry.level || level,
        topic: entry.topic || topic,
        english_term: entry.english_term,
        amharic_term: entry.amharic_term || null,
        definition: entry.definition || null,
        english_sentence: entry.english_sentence || null,
        amharic_sentence: entry.amharic_sentence || null,
        tags: entry.tags || [],
      }))

      const insertResult = await supabase
        .from('study_entries')
        .insert(rows)

      if (insertResult.error) {
        return NextResponse.json(
          {
            error: 'Failed to save extracted entries.',
            details: insertResult.error.message,
          },
          { status: 500 }
        )
      }

      const { count, error: countError } = await supabase
        .from('study_entries')
        .select('*', { count: 'exact', head: true })
        .eq('source_id', sourceData.id)

      if (countError) {
        return NextResponse.json(
          {
            error: 'Insert count check failed.',
            details: countError.message,
          },
          { status: 500 }
        )
      }

      savedEntriesCount = count || 0
      insertDebug = {
        sourceId: sourceData.id,
        attemptedRows: rows.length,
        countedRowsForSource: count || 0,
        level,
        topic,
        firstRow: rows[0] || null,
      }

      return null
    }

    if (
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')
    ) {
      const parsed = await parsePdfFile(file)
      parsedText = parsed.text
      parsePreview = parsed.text.slice(0, 1000)
      parsePages = parsed.pages
    } else if (
      file.type === 'text/plain' ||
      file.name.toLowerCase().endsWith('.txt')
    ) {
      const parsed = await parseTxtFile(file)
      parsedText = parsed.text
      parsePreview = parsed.text.slice(0, 1000)
      parsePages = parsed.pages
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.toLowerCase().endsWith('.docx')
    ) {
      const parsed = await parseDocxFile(file)
      parsedText = parsed.text
      parsePreview = parsed.text.slice(0, 1000)
      parsePages = parsed.pages
    } else if (
      file.type === 'text/csv' ||
      file.name.toLowerCase().endsWith('.csv')
    ) {
      const parsed = await parseCsvFile(file)
      parsePreview = `CSV rows parsed: ${parsed.entries.length}`
      parsePages = 1

      const saveErrorResponse = await saveParsedEntries(parsed.entries)
      if (saveErrorResponse) return saveErrorResponse
    } else if (
      file.type === 'application/json' ||
      file.name.toLowerCase().endsWith('.json')
    ) {
      const parsed = await parseJsonFile(file)
      parsePreview = `JSON entries parsed: ${parsed.entries.length}` + (parsed.scenarios ? ` | Scenarios parsed: ${parsed.scenarios.length}` : '')
      parsePages = 1

      const saveErrorResponse = await saveParsedEntries(parsed.entries)
      if (saveErrorResponse) return saveErrorResponse

      if (parsed.scenarios && parsed.scenarios.length > 0) {
        // Save scenarios
        const scenarioRows = parsed.scenarios.map(s => ({
          title: s.title,
          level: s.level || level,
          topic: s.topic || topic,
          source_type: 'upload',
        }))
        const { data: scenariosInserted, error: scError } = await supabase.from('scenarios').insert(scenarioRows).select()
        
        if (scError) {
          return NextResponse.json({ error: 'Failed to save scenarios', details: scError.message }, { status: 500 })
        }

        // Save turns
        const turnRows: any[] = []
        parsed.scenarios.forEach((s, idx) => {
          const insertedId = scenariosInserted[idx]?.id
          if (!insertedId) return
          s.turns.forEach((t, tIdx) => {
            turnRows.push({
              scenario_id: insertedId,
              turn_order: tIdx + 1,
              speaker: t.speaker,
              source_language: t.source_language,
              source_text: t.source_text,
              target_reference_text: t.target_reference_text || null,
            })
          })
        })

        if (turnRows.length > 0) {
          const { error: tError } = await supabase.from('scenario_turns').insert(turnRows)
          if (tError) {
            return NextResponse.json({ error: 'Failed to save scenario turns', details: tError.message }, { status: 500 })
          }
        }
      }
    }

    if (parsedText) {
      // Auto-detect scenario PDFs by query param or filename
      const isScenarioPdf = uploadType === 'scenario' || file.name.toLowerCase().includes('scenario')

      if (isScenarioPdf) {
        // Extract scenarios via AI
        const scenarios = await extractScenariosFromText(parsedText, file.name)

        if (scenarios && scenarios.length > 0) {
          const scenarioRows = scenarios.map(s => ({
            title: s.title,
            level: s.level || level,
            topic: s.topic || topic,
            source_type: 'upload',
          }))
          const { data: scenariosInserted, error: scError } = await supabase.from('scenarios').insert(scenarioRows).select()
          
          if (scError) {
            return NextResponse.json({ error: 'Failed to save PDF scenarios', details: scError.message }, { status: 500 })
          }

          const turnRows: { scenario_id: string; turn_order: number; speaker: string; source_language: string; source_text: string; target_reference_text: string | null }[] = []
          scenarios.forEach((s, idx) => {
            const insertedId = scenariosInserted[idx]?.id
            if (!insertedId) return
            s.turns.forEach((t, tIdx) => {
              turnRows.push({
                scenario_id: insertedId,
                turn_order: tIdx + 1,
                speaker: t.speaker,
                source_language: t.source_language,
                source_text: t.source_text,
                target_reference_text: t.target_reference_text || null,
              })
            })
          })

          if (turnRows.length > 0) {
            const { error: tError } = await supabase.from('scenario_turns').insert(turnRows)
            if (tError) {
              return NextResponse.json({ error: 'Failed to save PDF scenario turns', details: tError.message }, { status: 500 })
            }
          }

          extractedEntriesCount = scenarios.reduce((sum, s) => sum + s.turns.length, 0)
        }
      } else {
        const extracted = await extractGlossaryEntriesFromText(parsedText, file.name)
        const saveErrorResponse = await saveParsedEntries(extracted.entries)
        if (saveErrorResponse) return saveErrorResponse
      }
    }

    await supabase
      .from('study_sources')
      .update({ parse_status: 'completed' })
      .eq('id', sourceData.id)

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      sourceId: sourceData.id,
      parseStatus: 'completed',
      parsePages,
      parsePreview,
      rawTextPreview: parsedText ? parsedText.slice(0, 2000) : null,
      extractedEntriesCount,
      extractedEntriesPreview,
      savedEntriesCount,
      insertDebug,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Upload failed.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
