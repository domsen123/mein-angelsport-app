import type { CreateClubEventCommand } from '~~/server/actions/clubEvent/create-club-event'
import type { GetClubEventByIdCommandInput, GetClubEventByIdResponse } from '~~/server/actions/clubEvent/get-club-event-by-id'
import type { GetClubEventsByClubIdCommandInput } from '~~/server/actions/clubEvent/get-club-events-by-club-id'
import type { UpdateClubEventCommand } from '~~/server/actions/clubEvent/update-club-event'

export const useClubEventClient = () => {
  const { $api } = useNuxtApp()

  const getClubEventsByClubId = ({ clubId, pagination }: GetClubEventsByClubIdCommandInput) => $api(`/api/club/${clubId}/_admin/events`, {
    method: 'GET',
    query: {
      ...pagination,
    },
  })

  const getClubEventById = ({ clubId, eventId }: GetClubEventByIdCommandInput) => $api<GetClubEventByIdResponse>(`/api/club/${clubId}/_admin/events/${eventId}`, {
    method: 'GET',
  })

  const createClubEvent = (input: CreateClubEventCommand) => $api(`/api/club/${input.clubId}/_admin/events`, {
    method: 'POST',
    body: input,
  })

  const updateClubEvent = (input: UpdateClubEventCommand) => $api(`/api/club/${input.clubId}/_admin/events/${input.eventId}`, {
    method: 'PUT',
    body: input,
  })

  return {
    getClubEventsByClubId,
    getClubEventById,
    createClubEvent,
    updateClubEvent,
  }
}
