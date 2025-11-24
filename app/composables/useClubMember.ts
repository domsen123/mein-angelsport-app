import type { GetClubMembersByClubIdCommandInput } from '~~/server/actions/clubMember/get-club-members-by-club-id'
import { useClubMembersByClubIdQuery } from '~/actions/clubMembers/queries'

export const useClubMember = () => {
  const byClubId = (options: MaybeRefOrGetter<Partial<GetClubMembersByClubIdCommandInput>>) => useQuery(useClubMembersByClubIdQuery, ({
    clubId: toValue(options).clubId!,
    pagination: toValue(options).pagination!,
  }))

  return {
    byClubId,
  }
}
