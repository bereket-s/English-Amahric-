export function normalizeEnglish(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeAmharic(input: string) {
  return input
    .trim()
    .replace(/\s+/g, ' ')
}