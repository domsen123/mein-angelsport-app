import type { CreateClubRoleCommand } from '~~/server/actions/clubRole/create-club-role'
import type { UpdateClubRoleCommand } from '~~/server/actions/clubRole/update-club-role'
import { useClubRoleClient } from './api'
import { CLUB_ROLE_QUERY_KEYS } from './queries'

export function useCreateClubRoleMutation() {
  const queryCache = useQueryCache()
  const client = useClubRoleClient()

  return useMutation({
    mutation: (input: CreateClubRoleCommand) => client.createClubRole(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: [...CLUB_ROLE_QUERY_KEYS.root, 'by-club-id', variables.clubId] })
    },
  })
}

export function useUpdateClubRoleMutation() {
  const queryCache = useQueryCache()
  const client = useClubRoleClient()

  return useMutation({
    mutation: (input: UpdateClubRoleCommand) => client.updateClubRole(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: [...CLUB_ROLE_QUERY_KEYS.root, 'by-club-id', variables.clubId] })
      queryCache.invalidateQueries({ key: CLUB_ROLE_QUERY_KEYS.getClubRoleById({ clubId: variables.clubId, roleId: variables.roleId }) })
    },
  })
}
