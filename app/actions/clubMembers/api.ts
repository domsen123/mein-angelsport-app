import type { CreateInitalClubMemberCommand } from '~~/server/actions/clubMember/create-club-member'
import type { GetClubMemberByIdCommandInput } from '~~/server/actions/clubMember/get-club-member-by-id'
import type { GetClubMembersByClubIdCommandInput } from '~~/server/actions/clubMember/get-club-members-by-club-id'
import type { UpdateClubMemberCommand } from '~~/server/actions/clubMember/update-club-member'

export const useClubMemberClient = () => {
  const { $api } = useNuxtApp()

  const getClubMembersByClubId = ({ clubId, pagination }: GetClubMembersByClubIdCommandInput) => $api(`/api/club/${clubId}/_admin/members`, {
    method: 'GET',
    query: {
      ...pagination,
    },
  })

  const getClubMemberById = ({ clubId, memberId }: GetClubMemberByIdCommandInput) => $api(`/api/club/${clubId}/_admin/members/${memberId}`, {
    method: 'GET',
  })

  const createClubMember = ({ clubId, ...body }: CreateInitalClubMemberCommand) => $api(`/api/club/${clubId}/_admin/members`, {
    method: 'POST',
    body,
  })

  const updateClubMember = ({ clubId, memberId, ...body }: UpdateClubMemberCommand) => $api(`/api/club/${clubId}/_admin/members/${memberId}`, {
    method: 'PUT',
    body,
  })

  const assignRoleToMember = ({ clubId, memberId, roleId }: { clubId: string, memberId: string, roleId: string }) => $api(`/api/club/${clubId}/_admin/members/${memberId}/roles`, {
    method: 'POST',
    body: { roleId },
  })

  const removeRoleFromMember = ({ clubId, memberId, roleId }: { clubId: string, memberId: string, roleId: string }) => $api(`/api/club/${clubId}/_admin/members/${memberId}/roles/${roleId}`, {
    method: 'DELETE',
  })

  return {
    getClubMembersByClubId,
    getClubMemberById,
    createClubMember,
    updateClubMember,
    assignRoleToMember,
    removeRoleFromMember,
  }
}
