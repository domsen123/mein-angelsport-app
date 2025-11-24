import { useClubRolesByClubIdQuery } from '~/actions/clubRoles/queries'

export const useClubRole = () => {
  const byClubId = (clubId?: MaybeRefOrGetter<string>) => useQuery(useClubRolesByClubIdQuery, ({
    clubId: toValue(clubId!),
  }))

  return {
    byClubId,
  }
}
