import { ulid } from 'zod'

export const extractFirstAndLastName = (fullName: string): { firstName: string, lastName: string } => {
  const names = fullName.trim().split(' ')
  const firstName = names.slice(0, -1).join(' ') || names[0] || ''
  const lastName = names.length > 1 ? names[names.length - 1] || '' : ''
  return { firstName, lastName }
}

/**
 * Converts a club name to a URL-friendly slug
 * Handles German umlauts: ä→a, ö→o, ü→u, ß→ss
 *
 * @param name - The club name to convert
 * @returns URL-friendly slug or fallback "club-[ULID]" if empty
 *
 * @example
 * generateSlug("Fischer Verein München") // "fischer-verein-munchen"
 * generateSlug("Anglerclub Ärzte") // "anglerclub-arzte"
 * generateSlug("!!!") // "club-01HQZX3Y7K8M9N0P1Q2R3S4T5U"
 */
export function generateSlug(name: string): string {
  // Handle German umlauts
  const umlautMap: Record<string, string> = {
    ä: 'ae',
    ö: 'oe',
    ü: 'ue',
    Ä: 'Ae',
    Ö: 'Oe',
    Ü: 'Ue',
    ß: 'ss',
  }

  let slug = name
  for (const [umlaut, replacement] of Object.entries(umlautMap)) {
    slug = slug.replaceAll(umlaut, replacement)
  }

  // Convert to lowercase, replace spaces with hyphens, remove special characters
  slug = slug
    .toLowerCase()
    .trim()
    .replaceAll(/\s+/g, '-') // Replace spaces with hyphens
    .replaceAll(/[^\w-]+/g, '') // Remove non-alphanumeric characters except hyphens
    .replaceAll(/-{2,}/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '') // Remove leading hyphens
    .replace(/-+$/, '') // Remove trailing hyphens

  // Fallback to "club-[ULID]" if slug is empty after sanitization
  if (slug.length === 0) {
    return `club-${ulid().toLowerCase()}`
  }

  return slug
}
