import { extractText, getDocumentProxy } from 'unpdf'

export async function parsePdfFile(file: File) {
  const arrayBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)

  const document = await getDocumentProxy(uint8Array)
  // mergePages: false keeps each page's internal newlines intact
  const { text } = await extractText(document, { mergePages: false })

  // Join pages with a double newline to separate content blocks
  const joinedText = Array.isArray(text) ? text.join('\n\n') : (typeof text === 'string' ? text : '')

  return {
    text: joinedText,
    pages: document.numPages || 0,
  }
}
