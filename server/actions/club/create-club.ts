import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { ulid } from 'ulid'
import { z } from 'zod'
import { doDatabaseOperation, ensureUniqueSlug } from '~~/server/database/helper'
import { club } from '~~/server/database/schema'
import { extractFirstAndLastName, generateSlug } from '~~/server/utils/helpers'
import { _createClubMember } from '../clubMember/create-club-member'
import { _createClubRole } from '../clubRole/create-club-role'
import { _assignRoleToMember } from '../clubRoleMember/assign-role-to-member'
import { getUserbyId } from '../user/get-user-by-id'
import { _getClubById } from './get-club-by-id'

/**
 * CreateClubCommand
 *
 * Command DTO for creating a new club.
 * Reuses existing validation schema for consistency.
 */
export const CreateClubCommandSchema = z.object({
  name: z
    .string()
    .min(1, 'Vereinsname kann nicht leer sein')
    .max(40, 'Vereinsname darf 40 Zeichen nicht überschreiten')
    .describe('Der vollständige Name des Vereins')
    .trim(),
  shortName: z
    .string()
    .min(1, 'Kurzname kann nicht leer sein')
    .max(15, 'Kurzname darf 15 Zeichen nicht überschreiten')
    .describe('Ein kurzer Name der auf mobilen Geräten verwendet wird')
    .trim(),
  slug: slugSchema.max(20, 'Slug darf 20 Zeichen nicht überschreiten').optional(),
})

export type CreateClubCommand = z.infer<typeof CreateClubCommandSchema>

export const createClub = async (
  input: CreateClubCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // validation
  const data = CreateClubCommandSchema.parse(input)

  // preparation
  const clubId = ulid()
  const now = new Date()
  const slug = await ensureUniqueSlug(data.slug || generateSlug(data.name), club, db)
  const user = await getUserbyId(context.userId, db)

  // execution
  // -- 01. create club
  const [createdClub] = await db
    .insert(club)
    .values({
      id: clubId,
      name: data.name,
      shortName: data.shortName,
      slug,

      createdBy: context.userId,
      updatedBy: context.userId,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  // -- 02. create club member (the creator)
  const { firstName, lastName } = extractFirstAndLastName(user.name || 'Unbekannt')
  const member = await _createClubMember({
    clubId,
    userId: context.userId,
    firstName,
    lastName,
    preferredInvoicingMethod: 'email',
  }, context, db)

  const role = await _createClubRole({
    clubId,
    name: 'Vorstandschaft',
    isClubAdmin: true,
    isExemptFromWorkDuties: true,
  }, context, db)

  // -- 04. assign admin role to creator member
  await _assignRoleToMember({
    memberId: member.id,
    roleId: role.id,
  }, context, db)

  return _getClubById(createdClub.id, context, db)
}, tx)
