export function getLinkedInPostUrl(urn: string | null | undefined): string | null {
  if (!urn) return null
  const trimmed = urn.trim()
  if (!trimmed) return null
  if (!trimmed.startsWith('urn:li:')) return null
  return `https://www.linkedin.com/feed/update/${encodeURIComponent(trimmed)}/`
}

