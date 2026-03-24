import { useState, useEffect } from 'react'

export function useWikiImage(searchTerm: string) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!searchTerm) {
      setImageUrl(null)
      return
    }

    // Clean search term: remove parentheticals, get first word or phrase
    const cleaned = searchTerm.split('(')[0].trim().split(';')[0].trim()
    
    setLoading(true)
    
    // Use Wikipedia search generator to increase hit rate
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleaned)}&gsrlimit=1&prop=pageimages&format=json&pithumbsize=600&origin=*`
    
    fetch(url)
      .then(r => r.json())
      .then(data => {
        const pages = data.query?.pages
        if (!pages) throw new Error('No pages')
        
        const pageId = Object.keys(pages)[0]
        if (pageId === '-1' || !pages[pageId].thumbnail) {
          throw new Error('No image')
        }
        
        setImageUrl(pages[pageId].thumbnail.source)
      })
      .catch((err) => {
        // Silently fail to null if no image is found
        setImageUrl(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [searchTerm])

  return { imageUrl, loading }
}
