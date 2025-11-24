import type { GetClubMembersByClubIdCommandInput } from '~~/server/actions/clubMember/get-club-members-by-club-id'
import { useClubMemberClient } from './api'

export const CLUB_MEMBER_QUERY_KEYS = {
  root: ['club-members'] as const,
  getClubMembersByClubId: (args: GetClubMembersByClubIdCommandInput) => [...CLUB_MEMBER_QUERY_KEYS.root, 'by-club-id', args.clubId, JSON.stringify(args.pagination)] as const,
}

export const useClubMembersByClubIdQuery = ({ clubId, pagination }: GetClubMembersByClubIdCommandInput) => defineQueryOptions({
  key: CLUB_MEMBER_QUERY_KEYS.getClubMembersByClubId({ clubId, pagination }),
  query: () => {
    console.log('Fetching club members for clubId:', clubId, 'with pagination:', pagination)
    return useClubMemberClient().getClubMembersByClubId({ clubId, pagination })
  },
  enabled: !!clubId,
  staleTime: 1000 * 60 * 20, // 20 minutes
})
