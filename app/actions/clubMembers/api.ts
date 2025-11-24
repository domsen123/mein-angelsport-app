import type { GetClubRolesByClubIdCommandInput } from '~~/server/actions/clubRole/get-club-roles-by-club-id'

export const useClubMemberClient = () => {
  const { $api } = useNuxtApp()

  const getClubMembersByClubId = ({ clubId, pagination }: GetClubRolesByClubIdCommandInput) => $api(`/api/club/${clubId}/_admin/members`, {
    method: 'GET',
    query: {
      ...pagination,
    },
  })

  return {
    getClubMembersByClubId,
  }
}
