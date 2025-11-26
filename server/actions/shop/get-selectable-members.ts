import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubMember } from '~~/server/database/schema'
import { isExecutorClubMember } from '../clubMember/checks/is-executor-club-member'

export const GetSelectableMembersSchema = z.object({
  clubId: ulidSchema,
})

export type GetSelectableMembersInput = z.infer<typeof GetSelectableMembersSchema>

export const getSelectableMembers = async (
  input: GetSelectableMembersInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetSelectableMembersSchema.parse(input)
  const { clubId } = data

  const executorMember = await isExecutorClubMember(clubId, context, db)

  // Get self
  const members = [{
    id: executorMember.id,
    firstName: executorMember.firstName,
    lastName: executorMember.lastName,
    email: executorMember.email,
    street: executorMember.street,
    postalCode: executorMember.postalCode,
    city: executorMember.city,
    country: executorMember.country,
    isSelf: true,
  }]

  // Get managed members
  const managedMembers = await db.query.clubMember.findMany({
    where: eq(clubMember.managedBy, executorMember.id),
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      street: true,
      postalCode: true,
      city: true,
      country: true,
    },
  })

  for (const m of managedMembers) {
    members.push({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      street: m.street,
      postalCode: m.postalCode,
      city: m.city,
      country: m.country,
      isSelf: false,
    })
  }

  return { members }
}, tx)

// Response types for frontend usage
export type GetSelectableMembersResponse = Awaited<ReturnType<typeof getSelectableMembers>>
export type SelectableMember = GetSelectableMembersResponse['members'][number]
