import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is missing from .env.local.' }, { status: 500 })
    }

    const { sourceText, spokenText } = await request.json()

    if (!sourceText || !spokenText) {
      return NextResponse.json({ error: 'sourceText and spokenText are required.' }, { status: 400 })
    }

    const prompt = `You are an expert exact-sentence-recall evaluator. A student is practicing their active listening and recall by repeating an exact sentence they just heard.

Evaluate their recall carefully. You are comparing English to English (or Amharic to Amharic).
Do not penalize for minor punctuation or capitalization differences.
DO penalize for:
1. Substituted words (using a synonym instead of the exact word)
2. Missing words
3. Extra words

Original Sentence: "${sourceText}"
Student's Spoken Recall: "${spokenText}"

You MUST respond with only a JSON object. No markdown fences, no backticks, just pure JSON.
Example format:
{"score": 85, "status": "Close Match", "feedback": "You recalled the sentence well, but you missed the word 'immediately'."}

status MUST be exactly one of: "Exact Match", "Close Match", "Partial Match", "Needs Improvement"`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)

    let rawText = ''
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a strict but fair exact-sentence evaluator. Always return raw JSON. If the spoken text is completely different, score it very low.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 400,
        }),
      })

      rawText = await response.text()

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Groq API call failed.', details: rawText },
          { status: response.status || 500 }
        )
      }

      const result = JSON.parse(rawText)
      const content = result?.choices?.[0]?.message?.content || ''

      // Extract JSON from the content (strip any markdown fences if present)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json(
          { error: 'AI did not return valid JSON.', details: content },
          { status: 500 }
        )
      }

      const evaluation = JSON.parse(jsonMatch[0])
      return NextResponse.json({ success: true, evaluation })

    } catch (fetchError: unknown) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json({ error: 'Evaluation timed out. Please try again.' }, { status: 504 })
      }
      return NextResponse.json(
        { error: 'Network request to Groq failed.', details: fetchError instanceof Error ? fetchError.message : String(fetchError) },
        { status: 500 }
      )
    } finally {
      clearTimeout(timeout)
    }

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Evaluation failed.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
