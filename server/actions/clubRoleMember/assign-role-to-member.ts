import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubMemberRole } from '~~/server/database/schema'

export const AssignRoleToMemberCommandSchema = z.object({
  memberId: ulidSchema,
  roleId: ulidSchema,
})

export type AssignRoleToMemberCommand = z.infer<typeof AssignRoleToMemberCommandSchema>

export const _assignRoleToMember = async (
  input: AssignRoleToMemberCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = AssignRoleToMemberCommandSchema.parse(input)

  const [createdAssignment] = await db
    .insert(clubMemberRole)
    .values({
      memberId: data.memberId,
      roleId: data.roleId,

      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: context.userId,
      updatedBy: context.userId,
    })
  return createdAssignment
}, tx)
