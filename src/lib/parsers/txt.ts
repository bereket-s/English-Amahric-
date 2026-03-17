export async function parseTxtFile(file: File) {
  const text = await file.text()

  return {
    text: text || '',
    pages: 1,
  }
}
