import Papa from 'papaparse'
import type { ParsedStudyData, StudyEntry } from '../../types/study'

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function parseCsvFile(file: File): Promise<ParsedStudyData> {
  const text = await file.text()

  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  })

  const entries: StudyEntry[] = result.data
    .map((row) => ({
      english_term: clean(row.english_term || row.English || row.term || row.english),
      amharic_term: clean(row.amharic_term || row.Amharic || row.amharic),
      definition: clean(row.definition || row.Definition),
      english_sentence: clean(row.english_sentence || row.EnglishSentence || row.example_en),
      amharic_sentence: clean(row.amharic_sentence || row.AmharicSentence || row.example_am),
      tags: [],
    }))
    .filter((entry) => entry.english_term)

  return {
    entries,
    dialoguePatterns: [],
  }
}
