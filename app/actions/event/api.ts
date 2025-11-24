import type { GetEventsByClubIdCommand } from '~~/server/actions/clubEvent/get-events-by-club-id'

export const useEventClient = () => {
  const { $api } = useNuxtApp()

  const getEventsByClubId = ({ clubId }: GetEventsByClubIdCommand) => $api(`/api/club/${clubId}/events`, { method: 'GET' })

  return {
    getEventsByClubId,
  }
}
