import type { PaginationParams } from '~~/server/utils/validation'
import { useClubRolesByClubIdQuery } from '~/actions/clubRoles/queries'

export const useClubRole = () => {
  const byClubId = (clubId: MaybeRefOrGetter<string>, pagination: PaginationParams) => useQuery(useClubRolesByClubIdQuery, () => ({
    clubId: toValue(clubId),
    pagination,
  }))

  return {
    byClubId,
  }
}
