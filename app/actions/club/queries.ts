import type { GetClubBySlugCommand } from '~~/server/api/club/slug/[slug].get'
import { useClubClient } from './api'

export const CLUB_QUERY_KEYS = {
  root: ['club'] as const,
  getClubBySlug: (slug: string) => [...CLUB_QUERY_KEYS.root, 'by-slug', slug] as const,
}

export const useClubBySlugQuery = ({ slug }: GetClubBySlugCommand) => defineQueryOptions({
  key: CLUB_QUERY_KEYS.getClubBySlug(slug),
  query: () => useClubClient().getClubBySlug({ slug }),
  enabled: !!slug,
  staleTime: 1000 * 60 * 20, // 20 minutes
})
