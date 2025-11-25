import type { UpdateClubCommand } from '~~/server/actions/club/update-club-by-id'
import { useClubClient } from './api'
import { CLUB_QUERY_KEYS } from './queries'

export function useUpdateClubMutation() {
  const queryCache = useQueryCache()
  const client = useClubClient()

  return useMutation({
    mutation: (input: UpdateClubCommand) => client.updateClub(input),
    onSuccess() {
      queryCache.invalidateQueries({ key: CLUB_QUERY_KEYS.root })
    },
  })
}
