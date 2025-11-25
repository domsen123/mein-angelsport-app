import { APIError } from 'better-auth'
import { z } from 'zod'
import { updatePermitInstance, UpdatePermitInstanceCommandSchema } from '~~/server/actions/permitInstance/update-permit-instance'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

const bodySchema = UpdatePermitInstanceCommandSchema.omit({
  clubId: true,
  permitId: true,
  optionId: true,
  periodId: true,
  instanceId: true,
})

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId, permitId, optionId, periodId, instanceId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
    permitId: ulidSchema,
    optionId: ulidSchema,
    periodId: ulidSchema,
    instanceId: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, data => bodySchema.parse(data))

  try {
    return await updatePermitInstance({ clubId, permitId, optionId, periodId, instanceId, ...body }, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Aktualisieren der Erlaubniskarte ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})
