import type { DatabaseClient } from '~~/server/database/client'
import { and, eq, getTableColumns } from 'drizzle-orm'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubMember, clubMemberRole, clubRole } from '~~/server/database/schema'

export const _getClubMembership = async (clubId: string, userId: string, tx?: DatabaseClient) => doDatabaseOperation(async (db) => {
  const isMember = await db.query.clubMember.findFirst({
    where: (member, { and, eq }) => and(
      eq(member.clubId, clubId),
      eq(member.userId, userId),
    ),
  })

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

  const roles = memberRoles
  if (isMember) {
    roles.push({
      id: 'member',
      name: 'Mitglied',
      description: 'Standard Mitgliedsrolle',
      isClubAdmin: false,
      clubId,
      isExemptFromWorkDuties: false,
      createdAt: isMember.createdAt,
      updatedAt: isMember.updatedAt,
      createdBy: isMember.createdBy,
      updatedBy: isMember.updatedBy,
    })
  }

  return {
    hasAdminRole: memberRoles.some(role => role.isClubAdmin),
    roles,
  }
}, tx)
