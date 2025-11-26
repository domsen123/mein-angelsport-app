import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubMember } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const UpdateClubMemberCommandSchema = z.object({
  clubId: ulidSchema,
  memberId: ulidSchema,
  managedBy: ulidSchema.optional().nullable(),

  firstName: z.string().min(1).max(30),
  lastName: z.string().min(1).max(30),
  birthdate: z.coerce.date().optional().nullable(),

  street: z.string().min(5).max(100).optional().nullable(),
  postalCode: z.string().min(4).max(10).optional().nullable(),
  city: z.string().min(2).max(50).optional().nullable(),
  country: z.string().min(2).max(50).optional().nullable(),

  preferredInvoicingMethod: z.enum(['email', 'postal_mail']).optional().default('email'),
  email: z.email().optional().nullable(),
  phone: z.string().min(5).max(20).optional().nullable(),
})

export type UpdateClubMemberCommand = z.infer<typeof UpdateClubMemberCommandSchema>

export const _updateClubMember = async (
  input: UpdateClubMemberCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = UpdateClubMemberCommandSchema.parse(input)

  const [updatedMember] = await db
    .update(clubMember)
    .set({
      managedBy: data.managedBy || null,

      firstName: data.firstName,
      lastName: data.lastName,
      birthdate: data.birthdate || null,

      street: data.street || null,
      postalCode: data.postalCode || null,
      city: data.city || null,
      country: data.country || null,

      preferredInvoicingMethod: data.preferredInvoicingMethod,
      email: data.email || null,
      phone: data.phone || null,

      updatedBy: context.userId,
      updatedAt: new Date(),
    })
    .where(and(
      eq(clubMember.id, data.memberId),
      eq(clubMember.clubId, data.clubId),
    ))
    .returning()

  if (!updatedMember) {
    throw createError({
      statusCode: 404,
      message: 'Member not found',
    })
  }

  return updatedMember
}, tx)

export const updateClubMember = async (
  input: UpdateClubMemberCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return await _updateClubMember(input, context, db)
}, tx)
