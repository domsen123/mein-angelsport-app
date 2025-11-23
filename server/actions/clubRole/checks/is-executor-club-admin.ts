import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { APIError } from 'better-auth'
import { and, eq, getTableColumns } from 'drizzle-orm'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubMemberRole, clubRole } from '~~/server/database/schema'
import { isExecutorClubMember } from '../../clubMember/checks/is-executor-club-member'

export const isExecutorClubAdmin = async (
  clubId: string,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const isClubMember = await isExecutorClubMember(clubId, context, db)
  if (!isClubMember) {
    throw new APIError('FORBIDDEN', {
      message: 'Nur Vereinsmitglieder können diese Aktion ausführen.',
    })
  }

  const roles = await db
    .select({
      ...getTableColumns(clubRole),
    })
    .from(clubMemberRole)
    .innerJoin(clubRole, eq(clubMemberRole.roleId, clubRole.id))
    .where(
      and(
        eq(clubMemberRole.memberId, isClubMember.id),
        eq(clubRole.isClubAdmin, true),
      ),
    )
  if (roles.length === 0) {
    throw new APIError('FORBIDDEN', {
      message: 'Nur Vereinsadministratoren können diese Aktion ausführen.',
    })
  }
  return roles
}, tx)
