import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq, ne } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { club_water, water } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const UpdateWaterCommandSchema = z.object({
  clubId: ulidSchema,
  waterId: ulidSchema,
  type: z.enum(['lotic', 'lentic']),
  name: z.string().min(1, 'Gewässername ist erforderlich').max(100),
  postCode: z.string().min(1, 'Postleitzahl ist erforderlich').max(10),
})

export type UpdateWaterCommand = z.infer<typeof UpdateWaterCommandSchema>

export const _updateWater = async (
  input: UpdateWaterCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = UpdateWaterCommandSchema.parse(input)
  const { clubId, waterId } = data

  // Verify water belongs to club and get current data
  const clubWater = await db.query.club_water.findFirst({
    where: and(
      eq(club_water.clubId, clubId),
      eq(club_water.waterId, waterId),
    ),
    with: {
      water: true,
    },
  })

  if (!clubWater) {
    throw createError({
      statusCode: 404,
      message: 'Gewässer nicht gefunden',
    })
  }

  // Generate new slug based on updated values
  const preparedSlug = data.type === 'lentic' ? `${data.postCode}-${data.name}` : data.name
  let slug = generateSlug(preparedSlug)

  // Check if the slug would conflict with another water (excluding current record)
  const existingWithSlug = await db.query.water.findFirst({
    where: and(
      eq(water.slug, slug),
      ne(water.id, waterId),
    ),
  })

  // If there's a conflict, append a suffix
  if (existingWithSlug) {
    let suffix = 2
    while (true) {
      const candidateSlug = `${slug}-${suffix}`
      const conflict = await db.query.water.findFirst({
        where: and(
          eq(water.slug, candidateSlug),
          ne(water.id, waterId),
        ),
      })
      if (!conflict) {
        slug = candidateSlug
        break
      }
      suffix++
    }
  }

  // Update the water record
  const [updatedWater] = await db
    .update(water)
    .set({
      type: data.type,
      name: data.name,
      slug,
      postCode: data.postCode,
      updatedBy: context.userId,
      updatedAt: new Date(),
    })
    .where(eq(water.id, waterId))
    .returning()

  if (!updatedWater) {
    throw createError({
      statusCode: 404,
      message: 'Gewässer nicht gefunden',
    })
  }

  return updatedWater
}, tx)

export const updateWater = async (
  input: UpdateWaterCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _updateWater(input, context, db)
}, tx)
