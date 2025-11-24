import type { GetEventsByClubIdCommand } from '~~/server/actions/clubEvent/get-events-by-club-id'
import { useEventClient } from './api'

export const EVENT_QUERY_KEYS = {
  root: ['event'] as const,
  getEventsByClubId: (clubId: string) => [...EVENT_QUERY_KEYS.root, 'by-club-id', clubId] as const,
}

export const useEventsByClubIdQuery = ({ clubId }: GetEventsByClubIdCommand) => defineQueryOptions({
  key: EVENT_QUERY_KEYS.getEventsByClubId(clubId),
  query: () => useEventClient().getEventsByClubId({ clubId }),
  enabled: !!clubId,
})
