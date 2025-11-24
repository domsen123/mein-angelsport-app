export const useClubRoleClient = () => {
  const { $api } = useNuxtApp()

  const getClubRolesByClubId = ({ clubId }: { clubId: string }) => $api(`/api/club/${clubId}/_admin/roles`, { method: 'GET' })

  return {
    getClubRolesByClubId,
  }
}
