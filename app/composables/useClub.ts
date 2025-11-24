import z from 'zod'
import { useClubBySlugQuery } from '~/actions/club/queries'
import { useClubMembersByClubIdQuery } from '~/actions/clubMembers/queries'

export const useClub = () => {
  const slug = useRouteParams('slug', '')

  const { data: club, isLoading, error } = useQuery(useClubBySlugQuery, ({
    slug: slug.value,
  }))

  const isClubMember = computed(() => club.value?.membership.roles && club.value?.membership.roles.length > 0)
  const isClubAdmin = computed(() => club.value?.membership.hasAdminRole ?? false)

  const getEvents = () => useEvent().byClubId(club.value?.id)
  const getWaters = () => useWater().byClubId(club.value?.id)
  const getRoles = () => useClubRole().byClubId(club.value?.id)

  const getMembers = (pagination: ClientPaginationParams['pagination']) => useQuery(useClubMembersByClubIdQuery, () => ({
    clubId: club.value!.id,
    pagination: pagination.value,
  }))

  return {
    club,
    clubSlug: slug,
    isLoading,
    error,
    isClubMember,
    isClubAdmin,
    getEvents,
    getWaters,
    getRoles,
    getMembers,
  }
}
