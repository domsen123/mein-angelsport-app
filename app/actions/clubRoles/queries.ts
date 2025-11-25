import type { GetClubRoleByIdCommandInput } from '~~/server/actions/clubRole/get-club-role-by-id'
import type { GetClubRolesByClubIdCommandInput } from '~~/server/actions/clubRole/get-club-roles-by-club-id'
import { useClubRoleClient } from './api'

export const CLUB_ROLE_QUERY_KEYS = {
  root: ['club-roles'] as const,
  getClubRolesByClubId: (args: GetClubRolesByClubIdCommandInput) => [
    ...CLUB_ROLE_QUERY_KEYS.root,
    'by-club-id',
    args.clubId,
    JSON.stringify(args.pagination),
  ] as const,
  getClubRoleById: (args: GetClubRoleByIdCommandInput) => [
    ...CLUB_ROLE_QUERY_KEYS.root,
    'by-id',
    args.clubId,
    args.roleId,
  ] as const,
}

export const useClubRolesByClubIdQuery = ({ clubId, pagination }: GetClubRolesByClubIdCommandInput) => defineQueryOptions({
  key: CLUB_ROLE_QUERY_KEYS.getClubRolesByClubId({ clubId, pagination }),
  query: () => useClubRoleClient().getClubRolesByClubId({ clubId, pagination }),
  enabled: !!clubId,
  staleTime: 1000 * 60 * 20, // 20 minutes
})

export const useClubRoleByIdQuery = ({ clubId, roleId }: GetClubRoleByIdCommandInput) => defineQueryOptions({
  key: CLUB_ROLE_QUERY_KEYS.getClubRoleById({ clubId, roleId }),
  query: () => useClubRoleClient().getClubRoleById({ clubId, roleId }),
  enabled: !!clubId && !!roleId,
  staleTime: 1000 * 60 * 20,
})
