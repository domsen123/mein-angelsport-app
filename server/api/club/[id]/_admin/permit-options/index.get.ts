import { z } from 'zod'
import { getPermitOptionsByClubId } from '~~/server/actions/permit/get-permit-options-by-club-id'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
  }).parse(params))

  return await getPermitOptionsByClubId({ clubId }, context)
})
