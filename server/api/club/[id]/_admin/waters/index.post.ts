import { z } from 'zod'
import { isExecutorClubAdmin } from '~~/server/actions/clubRole/checks/is-executor-club-admin'
import { assignWaterToClub } from '~~/server/actions/clubWater/assign-water-to-club'
import { createWater, CreateWaterSchema } from '~~/server/actions/water/create-water'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, CreateWaterSchema.parse)

  // Authorization check
  await isExecutorClubAdmin(clubId, context)

  // Create water (independent entity)
  const water = await createWater(body, context)

  if (!water) {
    throw createError({ statusCode: 500, message: 'Failed to create water' })
  }

  // Assign to club
  await assignWaterToClub({ clubId, waterId: water.id }, context)

  return water
})
