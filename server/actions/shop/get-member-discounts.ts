import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { APIError } from 'better-auth'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubMember, clubMemberRole, clubRole } from '~~/server/database/schema'
import { isExecutorClubMember } from '../clubMember/checks/is-executor-club-member'

export const GetMemberDiscountsSchema = z.object({
  clubId: ulidSchema,
  memberId: ulidSchema,
})

export type GetMemberDiscountsInput = z.infer<typeof GetMemberDiscountsSchema>

export const _getMemberDiscounts = async (
  input: GetMemberDiscountsInput,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetMemberDiscountsSchema.parse(input)
  const { clubId, memberId } = data

  // Verify member belongs to this club
  const member = await db.query.clubMember.findFirst({
    where: and(
      eq(clubMember.id, memberId),
      eq(clubMember.clubId, clubId),
    ),
    columns: {
      id: true,
    },
  })

  if (!member) {
    throw new APIError('NOT_FOUND', {
      message: 'Mitglied nicht gefunden.',
    })
  }

  // Get all roles the member has
  const memberRoles = await db
    .select({
      roleId: clubRole.id,
      roleName: clubRole.name,
    })
    .from(clubMemberRole)
    .innerJoin(clubRole, eq(clubMemberRole.roleId, clubRole.id))
    .where(eq(clubMemberRole.memberId, memberId))

  if (memberRoles.length === 0) {
    return { discounts: [] }
  }

  // Get all discounts for these roles
  const roleIds = memberRoles.map(r => r.roleId)

  const allDiscounts = await db.query.clubRolePermitDiscount.findMany({
    where: (discount, { inArray }) => inArray(discount.clubRoleId, roleIds),
    columns: {
      permitOptionId: true,
      discountPercent: true,
      clubRoleId: true,
    },
  })

  // Group by permitOptionId and find highest discount per option
  const discountMap = new Map<string, {
    permitOptionId: string
    discountPercent: number
    roleId: string
    roleName: string
  }>()

  for (const discount of allDiscounts) {
    const existing = discountMap.get(discount.permitOptionId)
    const roleName = memberRoles.find(r => r.roleId === discount.clubRoleId)?.roleName ?? ''

    if (!existing || discount.discountPercent > existing.discountPercent) {
      discountMap.set(discount.permitOptionId, {
        permitOptionId: discount.permitOptionId,
        discountPercent: discount.discountPercent,
        roleId: discount.clubRoleId,
        roleName,
      })
    }
  }

  return {
    discounts: Array.from(discountMap.values()),
  }
}, tx)

export const getMemberDiscounts = async (
  input: GetMemberDiscountsInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const executorMember = await isExecutorClubMember(input.clubId, context, db)

  // Check if executor can access this member's data
  if (executorMember.id !== input.memberId) {
    const targetMember = await db.query.clubMember.findFirst({
      where: and(
        eq(clubMember.id, input.memberId),
        eq(clubMember.clubId, input.clubId),
      ),
      columns: {
        managedBy: true,
      },
    })

    if (!targetMember || targetMember.managedBy !== executorMember.id) {
      throw new APIError('FORBIDDEN', {
        message: 'Sie haben keine Berechtigung, die Daten dieses Mitglieds einzusehen.',
      })
    }
  }

  return _getMemberDiscounts(input, context, db)
}, tx)

// Response types for frontend usage
export type GetMemberDiscountsResponse = Awaited<ReturnType<typeof _getMemberDiscounts>>
export type MemberDiscount = GetMemberDiscountsResponse['discounts'][number]
