import type { GetClubRolesByClubIdCommandInput } from '~~/server/actions/clubRole/get-club-roles-by-club-id'

export const useClubRoleClient = () => {
  const { $api } = useNuxtApp()

  const getClubRolesByClubId = ({ clubId, pagination }: GetClubRolesByClubIdCommandInput) => $api(`/api/club/${clubId}/_admin/roles`, {
    method: 'GET',
    query: {
      ...pagination,
    },
  })

  return {
    getClubRolesByClubId,
  }
}
