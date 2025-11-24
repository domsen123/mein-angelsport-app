import type { GetWatersByClubIdCommand } from '~~/server/actions/water/get-waters-by-club-id'
import { useWaterClient } from './api'

export const WATER_QUERY_KEYS = {
  root: ['water'] as const,
  getWatersByClubId: (clubId: string) => [...WATER_QUERY_KEYS.root, 'by-club-id', clubId] as const,
}

export const useWatersByClubIdQuery = ({ clubId }: GetWatersByClubIdCommand) => defineQueryOptions({
  key: WATER_QUERY_KEYS.getWatersByClubId(clubId),
  query: () => useWaterClient().getWatersByClubId({ clubId }),
  enabled: !!clubId,
})
