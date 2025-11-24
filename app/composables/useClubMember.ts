import { useClubMembersByClubIdQuery } from '~/actions/clubMembers/queries'

export const useClubMember = () => {
  const byClubId = (clubId?: MaybeRefOrGetter<string>) => useQuery(useClubMembersByClubIdQuery, ({
    clubId: toValue(clubId!),
  }))

  return {
    byClubId,
  }
}
