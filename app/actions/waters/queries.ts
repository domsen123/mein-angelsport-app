import type { GetWatersByClubIdCommand } from '~~/server/actions/water/get-waters-by-club-id'
import { useWaterClient } from './api'

export const WATER_QUERY_KEYS = {
  root: ['waters'] as const,
  getWatersByClubId: (args: GetWatersByClubIdCommand) => [
    ...WATER_QUERY_KEYS.root,
    'by-club-id',
    args.clubId,
  ] as const,
}

export const useWatersByClubIdQuery = ({ clubId }: GetWatersByClubIdCommand) =>
  defineQueryOptions({
    key: WATER_QUERY_KEYS.getWatersByClubId({ clubId }),
    query: () => useWaterClient().getWatersByClubId({ clubId }),
    enabled: !!clubId,
    staleTime: 1000 * 60 * 20, // 20 minutes
  })
