import type { GetClubEventByIdCommandInput } from '~~/server/actions/clubEvent/get-club-event-by-id'
import type { GetClubEventsByClubIdCommandInput } from '~~/server/actions/clubEvent/get-club-events-by-club-id'
import { useClubEventClient } from './api'

export const CLUB_EVENT_QUERY_KEYS = {
  root: ['club-events'] as const,
  getClubEventsByClubId: (args: GetClubEventsByClubIdCommandInput) => [
    ...CLUB_EVENT_QUERY_KEYS.root,
    'by-club-id',
    args.clubId,
    JSON.stringify(args.pagination),
  ] as const,
  getClubEventById: (args: GetClubEventByIdCommandInput) => [
    ...CLUB_EVENT_QUERY_KEYS.root,
    'by-id',
    args.clubId,
    args.eventId,
  ] as const,
}

export const useClubEventsByClubIdQuery = ({ clubId, pagination }: GetClubEventsByClubIdCommandInput) => defineQueryOptions({
  key: CLUB_EVENT_QUERY_KEYS.getClubEventsByClubId({ clubId, pagination }),
  query: () => useClubEventClient().getClubEventsByClubId({ clubId, pagination }),
  enabled: !!clubId,
  staleTime: 1000 * 60 * 20, // 20 minutes
})

export const useClubEventByIdQuery = ({ clubId, eventId }: GetClubEventByIdCommandInput) => defineQueryOptions({
  key: CLUB_EVENT_QUERY_KEYS.getClubEventById({ clubId, eventId }),
  query: () => useClubEventClient().getClubEventById({ clubId, eventId }),
  enabled: !!clubId && !!eventId && eventId !== 'new',
  staleTime: 1000 * 60 * 20,
})
