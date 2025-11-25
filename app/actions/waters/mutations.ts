import type { UpdateWaterCommand } from '~~/server/actions/water/update-water'
import { type CreateWaterInput, useWaterClient } from './api'
import { WATER_QUERY_KEYS } from './queries'

export function useCreateWaterMutation() {
  const queryCache = useQueryCache()
  const client = useWaterClient()

  return useMutation({
    mutation: (input: CreateWaterInput) => client.createWater(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: [...WATER_QUERY_KEYS.root, 'by-club-id', variables.clubId] })
    },
  })
}

export function useUpdateWaterMutation() {
  const queryCache = useQueryCache()
  const client = useWaterClient()

  return useMutation({
    mutation: (input: UpdateWaterCommand) => client.updateWater(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: [...WATER_QUERY_KEYS.root, 'by-club-id', variables.clubId] })
      queryCache.invalidateQueries({ key: WATER_QUERY_KEYS.getWaterById({ clubId: variables.clubId, waterId: variables.waterId }) })
    },
  })
}
