import type { CreateClubRoleCommand } from '~~/server/actions/clubRole/create-club-role'
import type { GetClubRoleByIdCommandInput, GetClubRoleByIdResponse } from '~~/server/actions/clubRole/get-club-role-by-id'
import type { GetClubRolesByClubIdCommandInput } from '~~/server/actions/clubRole/get-club-roles-by-club-id'
import type { UpdateClubRoleCommand } from '~~/server/actions/clubRole/update-club-role'

export const useClubRoleClient = () => {
  const { $api } = useNuxtApp()

  const getClubRolesByClubId = ({ clubId, pagination }: GetClubRolesByClubIdCommandInput) => $api(`/api/club/${clubId}/_admin/roles`, {
    method: 'GET',
    query: {
      ...pagination,
    },
  })

  const getClubRoleById = ({ clubId, roleId }: GetClubRoleByIdCommandInput) => $api<GetClubRoleByIdResponse>(`/api/club/${clubId}/_admin/roles/${roleId}`, {
    method: 'GET',
  })

  const createClubRole = (input: CreateClubRoleCommand) => $api(`/api/club/${input.clubId}/_admin/roles`, {
    method: 'POST',
    body: input,
  })

  const updateClubRole = (input: UpdateClubRoleCommand) => $api(`/api/club/${input.clubId}/_admin/roles/${input.roleId}`, {
    method: 'PUT',
    body: input,
  })

  return {
    getClubRolesByClubId,
    getClubRoleById,
    createClubRole,
    updateClubRole,
  }
}
