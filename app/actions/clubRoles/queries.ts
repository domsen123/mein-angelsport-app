import type { GetClubRolesByClubIdCommandInput } from '~~/server/actions/clubRole/get-club-roles-by-club-id'
import { useClubRoleClient } from './api'

export const CLUB_ROLE_QUERY_KEYS = {
  root: ['club-roles'] as const,
  getClubRolesByClubId: (clubId: string) => [...CLUB_ROLE_QUERY_KEYS.root, 'by-club-id', clubId] as const,
}

export const useClubRolesByClubIdQuery = ({ clubId }: GetClubRolesByClubIdCommandInput) => defineQueryOptions({
  key: CLUB_ROLE_QUERY_KEYS.getClubRolesByClubId(clubId),
  query: () => useClubRoleClient().getClubRolesByClubId({ clubId }),
  enabled: !!clubId,
  staleTime: 1000 * 60 * 20, // 20 minutes
})
