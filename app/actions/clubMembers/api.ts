import type { GetClubRolesByClubIdCommandInput } from '~~/server/actions/clubRole/get-club-roles-by-club-id'

export const useClubMemberClient = () => {
  const { $api } = useNuxtApp()

  const getClubMembersByClubId = ({ clubId }: GetClubRolesByClubIdCommandInput) => $api(`/api/club/${clubId}/_admin/members`, { method: 'GET' })

  return {
    getClubMembersByClubId,
  }
}
