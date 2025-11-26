import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { APIError } from 'better-auth'
import { and, eq, gte, lt } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { club, clubEvent, clubEventAttendance, clubMember, clubMemberRole, clubRole } from '~~/server/database/schema'
import { isExecutorClubMember } from '../clubMember/checks/is-executor-club-member'

export const GetWorkDutyStatusSchema = z.object({
  clubId: ulidSchema,
  memberId: ulidSchema,
})

export type GetWorkDutyStatusInput = z.infer<typeof GetWorkDutyStatusSchema>

export const _getWorkDutyStatus = async (
  input: GetWorkDutyStatusInput,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetWorkDutyStatusSchema.parse(input)
  const { clubId, memberId } = data

  // Get club settings
  const clubData = await db.query.club.findFirst({
    where: eq(club.id, clubId),
    columns: {
      workDutiesPerYear: true,
      workDutyPriceCents: true,
    },
  })

  if (!clubData) {
    throw new APIError('NOT_FOUND', {
      message: 'Verein nicht gefunden.',
    })
  }

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

  // Check if member has any role with isExemptFromWorkDuties
  const memberRoles = await db
    .select({
      isExemptFromWorkDuties: clubRole.isExemptFromWorkDuties,
    })
    .from(clubMemberRole)
    .innerJoin(clubRole, eq(clubMemberRole.roleId, clubRole.id))
    .where(eq(clubMemberRole.memberId, memberId))

  const isExempt = memberRoles.some(role => role.isExemptFromWorkDuties)

  // Count attended work duties from previous year
  const currentYear = new Date().getFullYear()
  const previousYear = currentYear - 1
  const previousYearStart = new Date(previousYear, 0, 1) // Jan 1 of previous year
  const previousYearEnd = new Date(currentYear, 0, 1) // Jan 1 of current year

  // Get work duty events from previous year with attendance
  const attendedWorkDuties = await db
    .select({
      eventId: clubEventAttendance.eventId,
    })
    .from(clubEventAttendance)
    .innerJoin(clubEvent, eq(clubEventAttendance.eventId, clubEvent.id))
    .where(
      and(
        eq(clubEventAttendance.memberId, memberId),
        eq(clubEventAttendance.status, 'attended'),
        eq(clubEvent.isWorkDuty, true),
        eq(clubEvent.clubId, clubId),
        gte(clubEvent.dateStart, previousYearStart),
        lt(clubEvent.dateStart, previousYearEnd),
      ),
    )

  const required = clubData.workDutiesPerYear ?? 0
  const attended = attendedWorkDuties.length
  const missing = Math.max(0, required - attended)
  const feePerDutyCents = clubData.workDutyPriceCents ? Number(clubData.workDutyPriceCents) : 0
  const totalFeeCents = isExempt ? 0 : missing * feePerDutyCents

  return {
    required,
    attended,
    missing,
    feePerDutyCents,
    totalFeeCents,
    isExempt,
    previousYear,
  }
}, tx)

export const getWorkDutyStatus = async (
  input: GetWorkDutyStatusInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const executorMember = await isExecutorClubMember(input.clubId, context, db)

  // Check if executor can access this member's data
  // They can if: it's themselves OR they manage the member
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

  return _getWorkDutyStatus(input, context, db)
}, tx)

// Response types for frontend usage
export type GetWorkDutyStatusResponse = Awaited<ReturnType<typeof _getWorkDutyStatus>>
