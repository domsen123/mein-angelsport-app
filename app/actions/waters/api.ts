import type { CreateWaterCommand } from '~~/server/actions/water/create-water'
import type { GetWaterByIdCommandInput, GetWaterByIdResponse } from '~~/server/actions/water/get-water-by-id'
import type { GetWatersByClubIdCommand } from '~~/server/actions/water/get-waters-by-club-id'
import type { UpdateWaterCommand } from '~~/server/actions/water/update-water'

// Client-side type that includes clubId for routing
export type CreateWaterInput = CreateWaterCommand & { clubId: string }

export const useWaterClient = () => {
  const { $api } = useNuxtApp()

  const getWatersByClubId = ({ clubId, pagination }: GetWatersByClubIdCommand) =>
    $api(`/api/club/${clubId}/_admin/waters`, {
      method: 'GET',
      query: {
        ...pagination,
      },
    })

  const getWaterById = ({ clubId, waterId }: GetWaterByIdCommandInput) =>
    $api<GetWaterByIdResponse>(`/api/club/${clubId}/_admin/waters/${waterId}`, {
      method: 'GET',
    })

  const createWater = ({ clubId, ...body }: CreateWaterInput) =>
    $api(`/api/club/${clubId}/_admin/waters`, {
      method: 'POST',
      body,
    })

  const updateWater = (input: UpdateWaterCommand) =>
    $api(`/api/club/${input.clubId}/_admin/waters/${input.waterId}`, {
      method: 'PUT',
      body: input,
    })

  return {
    getWatersByClubId,
    getWaterById,
    createWater,
    updateWater,
  }
}
