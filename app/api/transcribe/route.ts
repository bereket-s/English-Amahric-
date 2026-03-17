import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is missing.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const expectedLanguage = formData.get('expectedLanguage') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file uploaded.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64Audio = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = file.type || 'audio/webm'

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: expectedLanguage === 'en' 
                    ? 'Transcribe this audio exactly. It is in English. Return ONLY the spoken English text. Do not add explanations or translate to Amharic.'
                    : 'Transcribe this audio exactly. It is in Amharic. Return only the spoken Amharic text. Do not add explanations or translate to English.',
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Audio,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
          },
        }),
      }
    )

    const result = await geminiResponse.json()

    if (!geminiResponse.ok) {
      const isRateLimit = geminiResponse.status === 429 || JSON.stringify(result).includes('Quota exceeded')
      return NextResponse.json(
        {
          error: isRateLimit 
            ? 'Gemini API limit reached (15/min). Please wait 30 seconds and try again.' 
            : 'Transcription failed.',
          details: result?.error?.message || JSON.stringify(result),
        },
        { status: geminiResponse.status || 500 }
      )
    }

    const text =
      result?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || '')
        .join('\n')
        .trim() || ''

    return NextResponse.json({
      success: true,
      text,
      raw: result,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Transcription failed.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
