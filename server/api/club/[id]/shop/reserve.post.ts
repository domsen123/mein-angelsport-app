import { APIError } from 'better-auth'
import { z } from 'zod'
import { reservePermits } from '~~/server/actions/shop/reserve-permits'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

const bodySchema = z.object({
  memberId: ulidSchema,
  permits: z.array(z.object({
    optionPeriodId: ulidSchema,
  })).min(1),
})

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, b => bodySchema.parse(b))

  try {
    return await reservePermits({
      clubId,
      memberId: body.memberId,
      permits: body.permits,
    }, context)
  }
  catch (error: unknown) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Reservieren der Erlaubnisscheine ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})
