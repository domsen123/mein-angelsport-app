import type { GetClubBySlugCommand } from '~~/server/api/club/slug/[slug].get'

export const useClubClient = () => {
  const { $api } = useNuxtApp()

  const getClubBySlug = ({ slug }: GetClubBySlugCommand) => $api(`/api/club/slug/${slug}`, { method: 'GET' })

  return {
    getClubBySlug,
  }
}
