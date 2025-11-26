import type { GetClubMemberByIdCommandInput } from '~~/server/actions/clubMember/get-club-member-by-id'
import type { GetClubMembersByClubIdCommandInput } from '~~/server/actions/clubMember/get-club-members-by-club-id'
import { useClubMemberClient } from './api'

export const CLUB_MEMBER_QUERY_KEYS = {
  root: ['club-members'] as const,
  getClubMembersByClubId: (args: GetClubMembersByClubIdCommandInput) => [
    ...CLUB_MEMBER_QUERY_KEYS.root,
    'by-club-id',
    args.clubId,
    JSON.stringify(args.pagination),
    args.onlyWithAccount ? 'with-account' : 'all',
  ] as const,
  getClubMemberById: (args: GetClubMemberByIdCommandInput) => [
    ...CLUB_MEMBER_QUERY_KEYS.root,
    'by-id',
    args.clubId,
    args.memberId,
  ] as const,
}

export const useClubMembersByClubIdQuery = ({ clubId, pagination, onlyWithAccount }: GetClubMembersByClubIdCommandInput) => defineQueryOptions({
  key: CLUB_MEMBER_QUERY_KEYS.getClubMembersByClubId({ clubId, pagination, onlyWithAccount }),
  query: () => useClubMemberClient().getClubMembersByClubId({ clubId, pagination, onlyWithAccount }),
  enabled: !!clubId,
  staleTime: 1000 * 60 * 20, // 20 minutes
})

export const useClubMemberByIdQuery = ({ clubId, memberId }: GetClubMemberByIdCommandInput) => defineQueryOptions({
  key: CLUB_MEMBER_QUERY_KEYS.getClubMemberById({ clubId, memberId }),
  query: () => useClubMemberClient().getClubMemberById({ clubId, memberId }),
  enabled: !!clubId && !!memberId && memberId !== 'new',
  staleTime: 1000 * 60 * 20, // 20 minutes
})
