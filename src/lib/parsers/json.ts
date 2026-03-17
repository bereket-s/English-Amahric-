import type { ParsedStudyData, StudyEntry, ParsedScenario, ParsedScenarioTurn } from '../../types/study'

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function parseJsonFile(file: File): Promise<ParsedStudyData & { scenarios?: ParsedScenario[] }> {
  const text = await file.text()
  const parsed = JSON.parse(text)

  let scenarios: ParsedScenario[] = []

  // Case 1: The JSON is a single scenario object
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.turns)) {
    scenarios.push({
      title: parsed.title || 'Untitled Scenario',
      level: parsed.level || null,
      topic: parsed.topic || null,
      turns: parsed.turns.map((t: any) => ({
        speaker: clean(t.speaker || 'Unknown'),
        source_language: clean(t.source_language || 'en'),
        source_text: clean(t.source_text),
        target_reference_text: clean(t.target_reference_text || t.target_text),
      })).filter((t: any) => t.source_text)
    })
  } 
  // Case 2: The JSON is an array of scenarios
  else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].turns) {
    scenarios = parsed.map(s => ({
      title: s.title || 'Untitled Scenario',
      level: s.level || null,
      topic: s.topic || null,
      turns: Array.isArray(s.turns) ? s.turns.map((t: any) => ({
        speaker: clean(t.speaker || 'Unknown'),
        source_language: clean(t.source_language || 'en'),
        source_text: clean(t.source_text),
        target_reference_text: clean(t.target_reference_text || t.target_text),
      })).filter((t: any) => t.source_text) : []
    }))
  }

  // Parse dictionary entries as fallback or combined
  const rawEntries = Array.isArray(parsed) && !parsed[0]?.turns
    ? parsed
    : Array.isArray(parsed?.entries)
    ? parsed.entries
    : []

  const entries: StudyEntry[] = rawEntries
    .map((row: Record<string, unknown>) => ({
      english_term: clean(row.english_term || row.English || row.term || row.english),
      amharic_term: clean(row.amharic_term || row.Amharic || row.amharic),
      definition: clean(row.definition || row.Definition),
      english_sentence: clean(row.english_sentence || row.EnglishSentence || row.example_en),
      amharic_sentence: clean(row.amharic_sentence || row.AmharicSentence || row.example_am),
      tags: Array.isArray(row.tags) ? row.tags.filter((t): t is string => typeof t === 'string') : [],
    }))
    .filter((entry: StudyEntry) => entry.english_term)

  return {
    entries,
    dialoguePatterns: [],
    scenarios: scenarios.length > 0 ? scenarios : undefined
  }
}
