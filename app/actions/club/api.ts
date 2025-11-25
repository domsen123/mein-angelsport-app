import type { UpdateClubCommand } from '~~/server/actions/club/update-club-by-id'
import type { GetClubBySlugCommand } from '~~/server/api/club/slug/[slug].get'

export const useClubClient = () => {
  const { $api } = useNuxtApp()

  const getClubBySlug = ({ slug }: GetClubBySlugCommand) => $api(`/api/club/slug/${slug}`, { method: 'GET' })

  const updateClub = ({ clubId, ...body }: UpdateClubCommand) => $api(`/api/club/${clubId}/_admin`, { method: 'PUT', body })

  return {
    getClubBySlug,
    updateClub,
  }
}
