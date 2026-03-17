import mammoth from 'mammoth'

export async function parseDocxFile(file: File) {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const result = await mammoth.extractRawText({ buffer })

  return {
    text: result.value || '',
    pages: 1,
  }
}
