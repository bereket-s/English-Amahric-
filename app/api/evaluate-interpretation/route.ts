import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is missing from .env.local.' }, { status: 500 })
    }

    const { englishText, amharicText } = await request.json()

    if (!englishText || !amharicText) {
      return NextResponse.json({ error: 'englishText and amharicText are required.' }, { status: 400 })
    }

    const prompt = `You are an expert English-to-Amharic interpreter evaluator. A student is practicing interpreting English texts into Amharic.

Evaluate their interpretation carefully. Amharic has distinct grammar (SOV) and often uses different idioms. Do not penalize for correct Amharic sentence structure.

Evaluate based on:
1. Meaning preservation (did they capture the core message?)
2. Professionalism and vocabulary choice (would this be acceptable in a professional setting?)
3. Grammatical correctness in spoken Amharic.
4. Redundancy (dock points and mention if there are unnecessary, repeated, or redundant words that should be omitted)

Original English: "${englishText}"
Student's Amharic Interpretation: "${amharicText}"

You MUST respond with only a JSON object. No markdown fences, no backticks, just pure JSON.
Example format:
{"score": 85, "status": "Close Match", "feedback": "Your interpretation captured the main idea well, but some phrasing could be more professional. You also repeated the word 'በጣም' unnecessarily."}

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
            { role: 'system', content: 'You are a strict but fair language evaluator. Always return raw JSON. If the Amharic is nonsense or mostly English loan words unneccesarily, score it very low.' },
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

    } catch (fetchError: any) {
      if (fetchError?.name === 'AbortError') {
        return NextResponse.json({ error: 'Evaluation timed out. Please try again.' }, { status: 504 })
      }
      return NextResponse.json(
        { error: 'Network request to Groq failed.', details: fetchError?.message || String(fetchError) },
        { status: 500 }
      )
    } finally {
      clearTimeout(timeout)
    }

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Evaluation failed.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
