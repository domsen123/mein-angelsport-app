import type { GetClubMembersByClubIdCommandInput } from '~~/server/actions/clubMember/get-club-members-by-club-id'
import { useClubMemberClient } from './api'

export const CLUB_MEMBER_QUERY_KEYS = {
  root: ['club-members'] as const,
  getClubMembersByClubId: (clubId: string) => [...CLUB_MEMBER_QUERY_KEYS.root, 'by-club-id', clubId] as const,
}

export const useClubMembersByClubIdQuery = ({ clubId }: GetClubMembersByClubIdCommandInput) => defineQueryOptions({
  key: CLUB_MEMBER_QUERY_KEYS.getClubMembersByClubId(clubId),
  query: () => useClubMemberClient().getClubMembersByClubId({ clubId }),
  enabled: !!clubId,
  staleTime: 1000 * 60 * 20, // 20 minutes
})
