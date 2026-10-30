export function validateEndpoint(raw: string): string | null {
  let u: URL
  try { u = new URL(raw) } catch { return 'Invalid URL' }
  if (!['http:', 'https:'].includes(u.protocol)) return 'Only http/https URLs are allowed'
  const h = u.hostname.toLowerCase()
  const blocked =
    h === 'localhost' || h === '::1' || h === '[::1]' || h.endsWith('.local') ||
    /^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) ||
    /^169\.254\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || h === '0.0.0.0'
  return blocked ? 'Private or local addresses are not allowed' : null
}
