import { APIError } from 'better-auth'
import { z } from 'zod'
import { createPermitOption, CreatePermitOptionCommandSchema } from '~~/server/actions/permit/create-permit-option'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

const bodySchema = CreatePermitOptionCommandSchema.omit({ clubId: true, permitId: true })

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, permitId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    permitId: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data => bodySchema.parse(data))

  try {
    return await createPermitOption({ clubId, permitId, ...body }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Erstellen der Option ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})
