import type { DatabaseClient } from '~~/server/database/client'
import { and, eq, getTableColumns } from 'drizzle-orm'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubMember, clubMemberRole, clubRole } from '~~/server/database/schema'

export const _getClubMembership = async (clubId: string, userId: string, tx?: DatabaseClient) => doDatabaseOperation(async (db) => {
  const memberRoles = await db
    .select({
      ...getTableColumns(clubRole),
    })
    .from(clubMember)
    .innerJoin(clubMemberRole, eq(clubMember.id, clubMemberRole.memberId))
    .innerJoin(clubRole, eq(clubMemberRole.roleId, clubRole.id))
    .where(and(
      eq(clubMember.clubId, clubId),
      eq(clubMember.userId, userId),
    ))

  return {
    hasAdminRole: memberRoles.some(role => role.isClubAdmin),
    roles: memberRoles,
  }
}, tx)
