import { APIError } from 'better-auth'
import { z } from 'zod'
import { createPermitOptionPeriod, CreatePermitOptionPeriodCommandSchema } from '~~/server/actions/permit/create-permit-option-period'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

const bodySchema = CreatePermitOptionPeriodCommandSchema.omit({ clubId: true, permitId: true, optionId: true })

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, permitId, optionId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    permitId: ulidSchema,
    optionId: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data => bodySchema.parse(data))

  try {
    return await createPermitOptionPeriod({ clubId, permitId, optionId, ...body }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Erstellen des Zeitraums ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})
