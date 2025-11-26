import { APIError } from 'better-auth'
import { z } from 'zod'
import { createOrder } from '~~/server/actions/shop/create-order'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

const shippingAddressSchema = z.object({
  street: z.string().min(1),
  postalCode: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
})

const orderPermitSchema = z.object({
  permitInstanceId: ulidSchema,
  permitName: z.string(),
  optionName: z.string(),
  optionId: ulidSchema,
  originalPriceCents: z.number(),
  discountPercent: z.number().min(0).max(100).default(0),
})

const workDutyFeeSchema = z.object({
  missing: z.number(),
  feePerDutyCents: z.number(),
  totalFeeCents: z.number(),
})

const bodySchema = z.object({
  memberId: ulidSchema,
  permits: z.array(orderPermitSchema).min(1),
  workDutyFee: workDutyFeeSchema.optional(),
  shippingAddress: shippingAddressSchema,
})

export default defineAuthenticatedEventHandler(async (event) => {
  const context = createExecutionContext(event)

  const { id: clubId } = await getValidatedRouterParams(event, params => z.object({
    id: ulidSchema,
  }).parse(params))

  const body = await readValidatedBody(event, b => bodySchema.parse(b))

  try {
    return await createOrder({
      clubId,
      ...body,
    }, context)
  }
  catch (error: unknown) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Erstellen der Bestellung ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})
