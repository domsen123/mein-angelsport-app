import { APIError } from 'better-auth'
import { z } from 'zod'
import { updatePermitOptionPeriod, UpdatePermitOptionPeriodCommandSchema } from '~~/server/actions/permit/update-permit-option-period'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

const bodySchema = UpdatePermitOptionPeriodCommandSchema.omit({ clubId: true, permitId: true, optionId: true, periodId: true })

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, permitId, optionId, periodId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    permitId: ulidSchema,
    optionId: ulidSchema,
    periodId: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data => bodySchema.parse(data))

  try {
    return await updatePermitOptionPeriod({ clubId, permitId, optionId, periodId, ...body }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Aktualisieren des Zeitraums ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})
