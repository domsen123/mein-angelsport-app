import type { GetWatersByClubIdSimpleCommand } from '~~/server/actions/water/get-waters-by-club-id'

export const useWaterClient = () => {
  const { $api } = useNuxtApp()

  const getWatersByClubId = ({ clubId }: GetWatersByClubIdSimpleCommand) => $api(`/api/club/${clubId}/waters`, { method: 'GET' })

  return {
    getWatersByClubId,
  }
}
