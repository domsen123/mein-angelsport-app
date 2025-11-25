import type { CreateClubEventCommand } from '~~/server/actions/clubEvent/create-club-event'
import type { UpdateClubEventCommand } from '~~/server/actions/clubEvent/update-club-event'
import { useClubEventClient } from './api'
import { CLUB_EVENT_QUERY_KEYS } from './queries'

export function useCreateClubEventMutation() {
  const queryCache = useQueryCache()
  const client = useClubEventClient()

  return useMutation({
    mutation: (input: CreateClubEventCommand) => client.createClubEvent(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: [...CLUB_EVENT_QUERY_KEYS.root, 'by-club-id', variables.clubId] })
    },
  })
}

export function useUpdateClubEventMutation() {
  const queryCache = useQueryCache()
  const client = useClubEventClient()

  return useMutation({
    mutation: (input: UpdateClubEventCommand) => client.updateClubEvent(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: [...CLUB_EVENT_QUERY_KEYS.root, 'by-club-id', variables.clubId] })
      queryCache.invalidateQueries({ key: CLUB_EVENT_QUERY_KEYS.getClubEventById({ clubId: variables.clubId, eventId: variables.eventId }) })
    },
  })
}
