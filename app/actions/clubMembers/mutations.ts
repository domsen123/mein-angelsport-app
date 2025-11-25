import type { CreateInitalClubMemberCommand } from '~~/server/actions/clubMember/create-club-member'
import type { UpdateClubMemberCommand } from '~~/server/actions/clubMember/update-club-member'
import { useClubMemberClient } from './api'
import { CLUB_MEMBER_QUERY_KEYS } from './queries'

export function useCreateClubMemberMutation() {
  const queryCache = useQueryCache()
  const client = useClubMemberClient()

  return useMutation({
    mutation: (input: CreateInitalClubMemberCommand) => client.createClubMember(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: [...CLUB_MEMBER_QUERY_KEYS.root, 'by-club-id', variables.clubId] })
    },
  })
}

export function useUpdateClubMemberMutation() {
  const queryCache = useQueryCache()
  const client = useClubMemberClient()

  return useMutation({
    mutation: (input: UpdateClubMemberCommand) => client.updateClubMember(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: [...CLUB_MEMBER_QUERY_KEYS.root, 'by-club-id', variables.clubId] })
      queryCache.invalidateQueries({ key: CLUB_MEMBER_QUERY_KEYS.getClubMemberById({ clubId: variables.clubId, memberId: variables.memberId }) })
    },
  })
}

export function useAssignRoleToMemberMutation() {
  const queryCache = useQueryCache()
  const client = useClubMemberClient()

  return useMutation({
    mutation: (input: { clubId: string, memberId: string, roleId: string }) => client.assignRoleToMember(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: [...CLUB_MEMBER_QUERY_KEYS.root, 'by-club-id', variables.clubId] })
      queryCache.invalidateQueries({ key: CLUB_MEMBER_QUERY_KEYS.getClubMemberById({ clubId: variables.clubId, memberId: variables.memberId }) })
    },
  })
}

export function useRemoveRoleFromMemberMutation() {
  const queryCache = useQueryCache()
  const client = useClubMemberClient()

  return useMutation({
    mutation: (input: { clubId: string, memberId: string, roleId: string }) => client.removeRoleFromMember(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: [...CLUB_MEMBER_QUERY_KEYS.root, 'by-club-id', variables.clubId] })
      queryCache.invalidateQueries({ key: CLUB_MEMBER_QUERY_KEYS.getClubMemberById({ clubId: variables.clubId, memberId: variables.memberId }) })
    },
  })
}
