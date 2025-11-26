import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { APIError } from 'better-auth'
import { and, eq, max, sql } from 'drizzle-orm'
import { ulid } from 'ulid'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubMember, clubOrder, clubOrderItem, clubShopItem, permitInstance } from '~~/server/database/schema'
import { isExecutorClubMember } from '../clubMember/checks/is-executor-club-member'

const ShippingAddressSchema = z.object({
  street: z.string().min(1),
  postalCode: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
})

const OrderPermitSchema = z.object({
  permitInstanceId: ulidSchema,
  permitName: z.string(),
  optionName: z.string(),
  optionId: ulidSchema,
  originalPriceCents: z.number(),
  discountPercent: z.number().min(0).max(100).default(0),
})

const WorkDutyFeeSchema = z.object({
  missing: z.number(),
  feePerDutyCents: z.number(),
  totalFeeCents: z.number(),
})

export const CreateOrderSchema = z.object({
  clubId: ulidSchema,
  memberId: ulidSchema,
  permits: z.array(OrderPermitSchema).min(1),
  workDutyFee: WorkDutyFeeSchema.optional(),
  shippingAddress: ShippingAddressSchema,
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>

const generateOrderNumber = async (
  db: DatabaseClient,
  clubId: string,
): Promise<string> => {
  const currentYear = new Date().getFullYear()
  const yearPrefix = `${currentYear}-`

  // Find the highest order number for this year in this club
  const result = await db
    .select({
      maxNumber: max(clubOrder.orderNumber),
    })
    .from(clubOrder)
    .where(
      and(
        eq(clubOrder.clubId, clubId),
        sql`${clubOrder.orderNumber} LIKE ${`${yearPrefix}%`}`,
      ),
    )

  let nextNumber = 1
  if (result[0]?.maxNumber) {
    const lastNumber = result[0].maxNumber.split('-')[1] ?? '0'
    nextNumber = Number.parseInt(lastNumber, 10) + 1
  }

  return `${yearPrefix}${String(nextNumber).padStart(4, '0')}`
}

export const createOrder = async (
  input: CreateOrderInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = CreateOrderSchema.parse(input)
  const { clubId, memberId, permits, workDutyFee, shippingAddress } = data

  const executorMember = await isExecutorClubMember(clubId, context, db)

  // Check if executor can create order for this member
  if (executorMember.id !== memberId) {
    const targetMember = await db.query.clubMember.findFirst({
      where: and(
        eq(clubMember.id, memberId),
        eq(clubMember.clubId, clubId),
      ),
      columns: {
        managedBy: true,
      },
    })

    if (!targetMember || targetMember.managedBy !== executorMember.id) {
      throw new APIError('FORBIDDEN', {
        message: 'Sie haben keine Berechtigung, für dieses Mitglied zu bestellen.',
      })
    }
  }

  // Verify all permit instances are reserved by the executor
  const instanceIds = permits.map(p => p.permitInstanceId)
  const reservedInstances = await db.query.permitInstance.findMany({
    where: (instance, { inArray }) => inArray(instance.id, instanceIds),
    columns: {
      id: true,
      status: true,
      reservedBy: true,
    },
  })

  for (const permit of permits) {
    const instance = reservedInstances.find(i => i.id === permit.permitInstanceId)
    if (!instance) {
      throw new APIError('BAD_REQUEST', {
        message: `Erlaubnisschein-Karte nicht gefunden: ${permit.permitInstanceId}`,
      })
    }
    if (instance.status !== 'reserved') {
      throw new APIError('CONFLICT', {
        message: `Erlaubnisschein-Karte ist nicht reserviert: ${permit.permitName}`,
      })
    }
    if (instance.reservedBy !== executorMember.id) {
      throw new APIError('FORBIDDEN', {
        message: `Diese Erlaubnisschein-Karte wurde nicht von Ihnen reserviert: ${permit.permitName}`,
      })
    }
  }

  // Calculate totals
  let subtotalCents = 0
  let totalDiscountCents = 0

  const orderItems: Array<{
    id: string
    itemType: 'PERMIT' | 'SHOP_ITEM' | 'WORK_DUTY_FEE'
    permitInstanceId: string | null
    shopItemId: string | null
    name: string
    description: string | null
    originalPriceCents: number
    discountPercent: number
    discountCents: number
    finalPriceCents: number
    quantity: number
  }> = []

  for (const permit of permits) {
    const discountCents = Math.floor(permit.originalPriceCents * permit.discountPercent / 100)
    const finalPriceCents = permit.originalPriceCents - discountCents

    subtotalCents += permit.originalPriceCents
    totalDiscountCents += discountCents

    orderItems.push({
      id: ulid(),
      itemType: 'PERMIT',
      permitInstanceId: permit.permitInstanceId,
      shopItemId: null,
      name: permit.permitName,
      description: permit.optionName,
      originalPriceCents: permit.originalPriceCents,
      discountPercent: permit.discountPercent,
      discountCents,
      finalPriceCents,
      quantity: 1,
    })
  }

  // Add work duty fee if applicable
  const workDutyFeeCents = workDutyFee?.totalFeeCents ?? 0
  if (workDutyFeeCents > 0 && workDutyFee) {
    orderItems.push({
      id: ulid(),
      itemType: 'WORK_DUTY_FEE',
      permitInstanceId: null,
      shopItemId: null,
      name: `Arbeitsdienst-Ausgleich (${workDutyFee.missing} fehlend)`,
      description: null,
      originalPriceCents: workDutyFeeCents,
      discountPercent: 0,
      discountCents: 0,
      finalPriceCents: workDutyFeeCents,
      quantity: 1,
    })
  }

  // Get auto-add shop items
  const autoAddItems = await db.query.clubShopItem.findMany({
    where: and(
      eq(clubShopItem.clubId, clubId),
      eq(clubShopItem.autoAddOnPermitPurchase, true),
      eq(clubShopItem.isActive, true),
    ),
  })

  for (const item of autoAddItems) {
    subtotalCents += item.priceCents

    orderItems.push({
      id: ulid(),
      itemType: 'SHOP_ITEM',
      permitInstanceId: null,
      shopItemId: item.id,
      name: item.name,
      description: item.description,
      originalPriceCents: item.priceCents,
      discountPercent: 0,
      discountCents: 0,
      finalPriceCents: item.priceCents,
      quantity: 1,
    })
  }

  const totalCents = subtotalCents - totalDiscountCents + workDutyFeeCents

  // Generate order number
  const orderNumber = await generateOrderNumber(db, clubId)

  // Create order
  const orderId = ulid()
  await db.insert(clubOrder).values({
    id: orderId,
    clubId,
    orderNumber,
    memberId,
    buyerId: executorMember.id,
    status: 'PENDING',
    subtotalCents,
    discountCents: totalDiscountCents,
    workDutyFeeCents,
    totalCents,
    shippingAddress,
    createdBy: context.userId,
    updatedBy: context.userId,
  })

  // Create order items
  await db.insert(clubOrderItem).values(
    orderItems.map(item => ({
      ...item,
      orderId,
    })),
  )

  // Update permit instances to sold
  await db
    .update(permitInstance)
    .set({
      status: 'sold',
      soldAt: new Date(),
      ownerMemberId: memberId,
      reservedBy: null,
      reservedAt: null,
      updatedBy: context.userId,
    })
    .where(sql`${permitInstance.id} IN (${sql.join(instanceIds.map(id => sql`${id}`), sql`, `)})`)

  return {
    orderId,
    orderNumber,
    totalCents,
  }
}, tx)

// Response types for frontend usage
export type CreateOrderResponse = Awaited<ReturnType<typeof createOrder>>
