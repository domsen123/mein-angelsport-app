import { APIError } from 'better-auth'
import { z } from 'zod'
import { createPermit, CreatePermitCommandSchema } from '~~/server/actions/permit/create-permit'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

const bodySchema = CreatePermitCommandSchema.omit({ clubId: true })

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data => bodySchema.parse(data))

  try {
    return await createPermit({ clubId, ...body }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Erstellen des Erlaubnisscheins ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})
