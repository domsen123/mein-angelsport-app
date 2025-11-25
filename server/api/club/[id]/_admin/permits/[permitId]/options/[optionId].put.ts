import { APIError } from 'better-auth'
import { z } from 'zod'
import { updatePermitOption, UpdatePermitOptionCommandSchema } from '~~/server/actions/permit/update-permit-option'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

const bodySchema = UpdatePermitOptionCommandSchema.omit({ clubId: true, permitId: true, optionId: true })

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, permitId, optionId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    permitId: ulidSchema,
    optionId: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data => bodySchema.parse(data))

  try {
    return await updatePermitOption({ clubId, permitId, optionId, ...body }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Aktualisieren der Option ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})
