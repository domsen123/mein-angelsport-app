import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { ulid } from 'ulid'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubMember } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const CreateInitalClubMemberCommandSchema = z.object({
  clubId: ulidSchema,
  userId: ulidSchema.optional(),

  firstName: z.string().min(1).max(30),
  lastName: z.string().min(1).max(30),
  birthdate: z.date().optional(),

  street: z.string().min(5).max(100).optional(),
  postalCode: z.string().min(4).max(10).optional(),
  city: z.string().min(2).max(50).optional(),
  country: z.string().min(2).max(50).optional(),

  preferredInvoicingMethod: z.enum(['email', 'postal_mail']).optional().default('email'),
  email: z.email().optional(),
  phone: z.string().min(5).max(20).optional(),
})

export type CreateInitalClubMemberCommand = z.infer<typeof CreateInitalClubMemberCommandSchema>

export const _createClubMember = async (
  input: CreateInitalClubMemberCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = CreateInitalClubMemberCommandSchema.parse(input)

  const [createdMember] = await db
    .insert(clubMember)
    .values({
      id: ulid(),
      clubId: data.clubId,
      userId: data.userId || null,

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

      createdBy: context.userId,
      updatedBy: context.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()
  return createdMember
}, tx)

export const createClubMember = async (
  input: CreateInitalClubMemberCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return await _createClubMember(input, context, db)
}, tx)
