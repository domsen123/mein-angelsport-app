import { useClubBySlugQuery } from '~/actions/club/queries'
import { useClubEventsByClubIdQuery } from '~/actions/clubEvents/queries'
import { useClubMembersByClubIdQuery } from '~/actions/clubMembers/queries'
import { useClubRolesByClubIdQuery } from '~/actions/clubRoles/queries'
import { usePermitsByClubIdQuery } from '~/actions/permits/queries'
import { useWatersByClubIdQuery } from '~/actions/waters/queries'

export const useClub = () => {
  const slug = useRouteParams('slug', '')

  const { data: club, isLoading, error } = useQuery(useClubBySlugQuery, ({
    slug: slug.value,
  }))

  const isClubMember = computed(() => club.value?.membership.roles && club.value?.membership.roles.length > 0)
  const isClubAdmin = computed(() => club.value?.membership.hasAdminRole ?? false)

  const getEvents = () => useEvent().byClubId(club.value?.id)
  const getWaters = () => useWater().byClubId(club.value?.id)

  const getRoles = (pagination: ClientPaginationParams['pagination']) => useQuery(useClubRolesByClubIdQuery, () => ({
    clubId: club.value!.id,
    pagination: pagination.value,
  }))

  const getMembers = (pagination: ClientPaginationParams['pagination']) => useQuery(useClubMembersByClubIdQuery, () => ({
    clubId: club.value!.id,
    pagination: pagination.value,
  }))

  const getPermits = (pagination: ClientPaginationParams['pagination']) => useQuery(usePermitsByClubIdQuery, () => ({
    clubId: club.value!.id,
    pagination: pagination.value,
  }))

  const getWatersPaginated = (pagination: ClientPaginationParams['pagination']) => useQuery(useWatersByClubIdQuery, () => ({
    clubId: club.value!.id,
    pagination: pagination.value,
  }))

  const getEventsPaginated = (pagination: ClientPaginationParams['pagination']) => useQuery(useClubEventsByClubIdQuery, () => ({
    clubId: club.value!.id,
    pagination: pagination.value,
  }))

  // Alias for non-paginated waters (used by permit page)
  const getClubWaters = () => getWaters()

  return {
    club,
    clubSlug: slug,
    isLoading,
    error,
    isClubMember,
    isClubAdmin,
    getEvents,
    getWaters,
    getClubWaters,
    getRoles,
    getMembers,
    getPermits,
    getWatersPaginated,
    getEventsPaginated,
  }
}
