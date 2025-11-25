import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { club } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const UpdateClubCommandSchema = z.object({
  clubId: ulidSchema,
  name: z
    .string()
    .min(1, 'Vereinsname kann nicht leer sein')
    .max(40, 'Vereinsname darf 40 Zeichen nicht überschreiten')
    .trim(),
  shortName: z
    .string()
    .min(1, 'Kurzname kann nicht leer sein')
    .max(15, 'Kurzname darf 15 Zeichen nicht überschreiten')
    .trim(),

  // Work duties settings
  workDutiesPerYear: z.coerce.number().int().min(0).default(0),
  workDutyPriceCents: z
    .string()
    .max(10, 'Kosten dürfen 10 Zeichen nicht überschreiten')
    .nullable()
    .optional(),

  // Permit sale dates (DD-MM format)
  permitSaleStart: z
    .string()
    .regex(/^\d{2}-\d{2}$/, 'Format muss DD-MM sein')
    .nullable()
    .optional(),
  permitSaleEnd: z
    .string()
    .regex(/^\d{2}-\d{2}$/, 'Format muss DD-MM sein')
    .nullable()
    .optional(),
})

export type UpdateClubCommand = z.infer<typeof UpdateClubCommandSchema>

export const _updateClub = async (
  input: UpdateClubCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = UpdateClubCommandSchema.parse(input)

  const [updatedClub] = await db
    .update(club)
    .set({
      name: data.name,
      shortName: data.shortName,
      workDutiesPerYear: data.workDutiesPerYear,
      workDutyPriceCents: data.workDutyPriceCents || null,
      permitSaleStart: data.permitSaleStart || null,
      permitSaleEnd: data.permitSaleEnd || null,
      updatedBy: context.userId,
      updatedAt: new Date(),
    })
    .where(eq(club.id, data.clubId))
    .returning()

  if (!updatedClub) {
    throw createError({
      statusCode: 404,
      message: 'Verein nicht gefunden',
    })
  }

  return updatedClub
}, tx)

export const updateClub = async (
  input: UpdateClubCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _updateClub(input, context, db)
}, tx)
