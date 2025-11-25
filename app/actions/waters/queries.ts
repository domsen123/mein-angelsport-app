import type { GetWaterByIdCommandInput } from '~~/server/actions/water/get-water-by-id'
import type { GetWatersByClubIdCommand } from '~~/server/actions/water/get-waters-by-club-id'
import { useWaterClient } from './api'

export const WATER_QUERY_KEYS = {
  root: ['waters'] as const,
  getWatersByClubId: (args: GetWatersByClubIdCommand) => [
    ...WATER_QUERY_KEYS.root,
    'by-club-id',
    args.clubId,
    JSON.stringify(args.pagination),
  ] as const,
  getWaterById: (args: GetWaterByIdCommandInput) => [
    ...WATER_QUERY_KEYS.root,
    'by-id',
    args.clubId,
    args.waterId,
  ] as const,
}

export const useWatersByClubIdQuery = ({ clubId, pagination }: GetWatersByClubIdCommand) =>
  defineQueryOptions({
    key: WATER_QUERY_KEYS.getWatersByClubId({ clubId, pagination }),
    query: () => useWaterClient().getWatersByClubId({ clubId, pagination }),
    enabled: !!clubId,
    staleTime: 1000 * 60 * 20, // 20 minutes
  })

export const useWaterByIdQuery = ({ clubId, waterId }: GetWaterByIdCommandInput) =>
  defineQueryOptions({
    key: WATER_QUERY_KEYS.getWaterById({ clubId, waterId }),
    query: () => useWaterClient().getWaterById({ clubId, waterId }),
    enabled: !!clubId && !!waterId,
    staleTime: 1000 * 60 * 20,
  })
