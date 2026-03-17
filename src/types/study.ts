export interface StudyEntry {
  id?: string
  source_id?: string
  level?: string | null
  topic?: string | null
  english_term: string
  amharic_term?: string | null
  definition?: string | null
  english_sentence?: string | null
  amharic_sentence?: string | null
  tags?: string[]
}

export type ParsedScenarioTurn = {
  speaker: string
  source_language: string
  source_text: string
  target_reference_text?: string
}

export type ParsedScenario = {
  title: string
  level?: string | null
  topic?: string | null
  turns: ParsedScenarioTurn[]
}

export interface ParsedStudyData {
  entries: StudyEntry[]
  dialoguePatterns: string[]
  scenarios?: ParsedScenario[]
}