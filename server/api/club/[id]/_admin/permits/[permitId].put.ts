import { APIError } from 'better-auth'
import { z } from 'zod'
import { updatePermit, UpdatePermitCommandSchema } from '~~/server/actions/permit/update-permit'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

const bodySchema = UpdatePermitCommandSchema.omit({ clubId: true, permitId: true })

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, permitId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    permitId: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data => bodySchema.parse(data))

  try {
    return await updatePermit({ clubId, permitId, ...body }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Aktualisieren des Erlaubnisscheins ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})
