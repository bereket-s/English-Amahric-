import type { ParsedStudyData, StudyEntry } from '../../types/study'

function detectLevelFromTitle(title: string): string | null {
  const match = title.match(/L(\d)/i)
  return match ? `L${match[1]}` : null
}

async function extractChunkWithRetry(textChunk: string, defaultLevel: string | null, retries = 3): Promise<StudyEntry[]> {
  const isGemini = !!process.env.GEMINI_API_KEY && !process.env.AI_API_KEY
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY
  const endpoint = process.env.AI_ENDPOINT_URL || 'https://openrouter.ai/api/v1/chat/completions'
  const modelName = process.env.AI_MODEL_NAME || 'google/gemini-2.5-flash:free'

  if (!apiKey) {
    console.error('Missing AI API credentials in environment.')
    return []
  }

  const prompt = `Extract EVERY glossary entry you can find from the following medical English-Amharic PDF text.

Return a JSON array of objects with exactly these fields:
- "english_term": English medical noun/noun phrase (required, capitalized)
- "amharic_term": Amharic translation (string or null)
- "english_sentence": Sample sentence in English (string or null)
- "amharic_sentence": Amharic translation of sample sentence (string or null)
- "topic": Medical specialty (Cardiology, Pediatrics, Surgery, etc.)
- "level": Difficulty level. Default: "${defaultLevel || 'L3'}"

RULES:
- Return ONLY the raw JSON array. Do not use markdown fences like \`\`\`json.
- "english_term" must be a noun phrase only, never a sentence fragment.
- A dash "—" means the field is empty → set to null
- Amharic uses Ethiopic script (ሀ-ፐ range).
- WARNING: The text may be scrambled/column-extracted, so definitions and sentences might be physically separated from their terms. Please logically reconstruct them!

Raw text:
${textChunk}`

  try {
    let response: Response;

    if (isGemini) {
      // Native Gemini REST API
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
      response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.0, responseMimeType: 'application/json' }
        })
      })
    } else {
      // Universal OpenAI Compatible API (OpenRouter, Groq, GitHub Models, etc.)
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.0
          // Removed response_format: 'json_object' since many free models on OpenRouter don't support it
        })
      })
    }

    if (!response.ok) {
      const errText = await response.text()
      if (response.status === 429 && retries > 0) {
        console.warn(`[API Rate Limit Hit (${response.status})]. Sleeping for 15s before retry...`)
        await new Promise(r => setTimeout(r, 15000))
        return extractChunkWithRetry(textChunk, defaultLevel, retries - 1)
      }
      console.error(`AI API Error (${response.status}):`, errText)
      return []
    }

    const data = await response.json()
    let rawContent = ''
    
    if (isGemini) {
      rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
    } else {
      rawContent = data.choices?.[0]?.message?.content || '[]'
    }
    
    // We expect JSON but let's safely parse it. Sometimes GPT wraps in JSON object if triggered by json_object mode
    let parsed: any = []
    try {
      const parsedObj = JSON.parse(rawContent)
      // JSON mode often requires a top-level key like { "entries": [...] } or sometimes it returns the array directly
      if (Array.isArray(parsedObj)) parsed = parsedObj
      else if (parsedObj.entries && Array.isArray(parsedObj.entries)) parsed = parsedObj.entries
      else if (Object.keys(parsedObj).length > 0) {
         // Maybe it returned a dictionary of entries
         parsed = Object.values(parsedObj)[0]
         if (!Array.isArray(parsed)) parsed = []
      }
    } catch {
      // fallback to stripping fences
      const cleanContent = rawContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '')
      parsed = JSON.parse(cleanContent)
    }

    if (!Array.isArray(parsed)) return []
    
    return parsed
      .filter((item: any) => item.english_term && String(item.english_term).length >= 2)
      .map((item: any) => ({
        english_term: String(item.english_term || '').trim(),
        amharic_term: item.amharic_term ? String(item.amharic_term).trim() : null,
        definition: null,
        english_sentence: item.english_sentence ? String(item.english_sentence).trim() : null,
        amharic_sentence: item.amharic_sentence ? String(item.amharic_sentence).trim() : null,
        level: item.level ? String(item.level).trim() : (defaultLevel || 'L3'),
        topic: item.topic ? String(item.topic).trim() : 'General Medicine',
        tags: [],
      }))
  } catch (error: any) {
    if (retries > 0) {
      console.warn(`Extraction error: ${error.message}. Retrying in 5s...`)
      await new Promise(r => setTimeout(r, 5000))
      return extractChunkWithRetry(textChunk, defaultLevel, retries - 1)
    }
    console.error('AI extraction fatal error:', error.message)
    return []
  }
}

export async function extractGlossaryEntriesFromText(text: string, fileName?: string): Promise<ParsedStudyData> {
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn('No AI API Keys configured — skipping AI extraction.')
    return { entries: [], dialoguePatterns: [] }
  }

  const defaultLevel = fileName ? detectLevelFromTitle(fileName) : null

  // Group into 12-page chunks for Azure to maximize context and minimize parallel calls
  const PAGES_PER_CHUNK = 12
  const pages = text.split(/\n{2,}/).filter(p => p.trim().length > 50)
  
  const chunks: string[] = []
  for (let i = 0; i < pages.length; i += PAGES_PER_CHUNK) {
    chunks.push(pages.slice(i, i + PAGES_PER_CHUNK).join('\n\n'))
  }

  console.log(`AI extraction: ${pages.length} pages → ${chunks.length} API call(s), fileName="${fileName}"`)

  const allEntries: StudyEntry[] = []
  const seen = new Set<string>()

  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${chunks.length}...`)
    
    const entries = await extractChunkWithRetry(chunks[i], defaultLevel)
    
    let chunkYield = 0
    for (const entry of entries) {
      const key = entry.english_term.toLowerCase().trim()
      if (!seen.has(key)) {
        seen.add(key)
        allEntries.push(entry)
        chunkYield++
      }
    }
    
    console.log(`Chunk ${i + 1} yielded ${chunkYield} entries.`)
    
    // Let OpenAI burst without hard delays between standard requests
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 1500))
    }
  }

  console.log(`AI extraction complete: ${allEntries.length} unique entries found.`)
  return { entries: allEntries, dialoguePatterns: [] }
}

// ─── Scenario PDF Extractor ─────────────────────────────────────────────────

export type ScenarioTurn = {
  speaker: string
  source_language: string
  source_text: string
  target_reference_text: string | null
}

export type ExtractedScenario = {
  title: string
  level: string | null
  topic: string | null
  turns: ScenarioTurn[]
}

export async function extractScenariosFromText(text: string, fileName?: string): Promise<ExtractedScenario[]> {
  const isGemini = !!process.env.GEMINI_API_KEY && !process.env.AI_API_KEY
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY
  const endpoint = process.env.AI_ENDPOINT_URL || 'https://openrouter.ai/api/v1/chat/completions'
  const modelName = process.env.AI_MODEL_NAME || 'google/gemini-2.5-flash:free'
  const defaultLevel = fileName ? detectLevelFromTitle(fileName) : null

  if (!apiKey) {
    console.error('No AI API key found — cannot extract scenarios.')
    return []
  }

  const prompt = `You are extracting interpretation scenario dialogues from a medical training PDF.

The PDF contains English dialogue scripts intended to be interpreted into Amharic.
Each scenario is a short multi-turn role-play (e.g. Doctor-Patient, Nurse-Patient, Interpreter exercises).

Return a JSON array of scenario objects. Each object must have:
- "title": Short scenario title (e.g. "Emergency Room Intake", "Patient Triage")
- "level": Difficulty level like "L2", "L3", "L4" (or null)
- "topic": Medical topic (e.g. "Emergency", "Cardiology", "Pediatrics") (or null)
- "turns": Array of turn objects, each with:
  - "speaker": Who is speaking (e.g. "Doctor", "Patient", "Nurse", "Interpreter")
  - "source_language": Always "en" (English)
  - "source_text": The exact English phrase spoken
  - "target_reference_text": The ideal Amharic translation (or null if not provided)

RULES:
- Return ONLY the raw JSON array — no markdown, no fences.
- Split text into logical scenarios wherever there is a clear topic/scene change.
- If no Amharic translation is provided, set target_reference_text to null.
- Minimal valid scenario has at least 2 turns.

Raw text:
${text.slice(0, 12000)}`

  try {
    let response: Response

    if (isGemini) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
      response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
        })
      })
    } else {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        })
      })
    }

    if (!response.ok) {
      const errText = await response.text()
      console.error('Scenario AI extraction API error:', errText)
      return []
    }

    const json = await response.json()
    let raw = ''

    if (isGemini) {
      raw = json.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
    } else {
      raw = json.choices?.[0]?.message?.content || '[]'
    }

    // Strip markdown fences if present
    raw = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()

    const parsed = JSON.parse(raw)
    const scenarios: ExtractedScenario[] = Array.isArray(parsed) ? parsed : (parsed.scenarios || [])
    console.log(`Scenario AI extraction: found ${scenarios.length} scenario(s)`)
    return scenarios
  } catch (err) {
    console.error('Scenario extraction failed:', err)
    return []
  }
}