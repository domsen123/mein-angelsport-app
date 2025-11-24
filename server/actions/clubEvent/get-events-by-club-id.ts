import type { SQL } from 'drizzle-orm'
import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubEvent } from '~~/server/database/schema'
import { _isExecutorClubMember } from '../clubMember/checks/is-executor-club-member'

export const GetEventsByClubIdCommandSchema = z.object({
  clubId: ulidSchema,
})

export type GetEventsByClubIdCommand = z.infer<typeof GetEventsByClubIdCommandSchema>

export const _getEventsByClubId = async (
  input: GetEventsByClubIdCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // validation
  const data = GetEventsByClubIdCommandSchema.parse(input)

  // query
  const events = await db
    .select()
    .from(clubEvent)
    .where(eq(clubEvent.clubId, data.clubId))

  return events
}, tx)

export const getEventsByClubId = async (
  input: GetEventsByClubIdCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // validation
  const data = GetEventsByClubIdCommandSchema.parse(input)

  // preparations
  // -- check if current user is club member
  const isClubMember = await _isExecutorClubMember(input.clubId, context, db)

  const clubWhereConditions: SQL[] = []
  if (!isClubMember) {
    clubWhereConditions.push(eq(clubEvent.isPublic, true))
  }

  // get events
  const events = await db
    .select()
    .from(clubEvent)
    .where(and(
      eq(clubEvent.clubId, data.clubId),
      ...clubWhereConditions,
    ))
    .orderBy(asc(clubEvent.dateStart))

  // get attendances
  const eventIds = events.map(e => e.id)
  const attendances = await db.query.clubEventAttendance.findMany({
    columns: {
      eventId: true,
      memberId: true,
      status: true,
    },
    where: (cea, { inArray }) => inArray(cea.eventId, eventIds),
    with: {
      member: {
        columns: {
          userId: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  const result = events.map((event) => {
    const eventAttendances = attendances
      .filter(a => a.eventId === event.id)

    const currentUserEventStatus = eventAttendances.find(a => a.member.userId === context.userId)?.status || 'invited'

    return {
      ...event,
      currentUserEventStatus,
      eventAttendancesCount: eventAttendances.filter(a => a.status === 'attended' || a.status === 'accepted').length,
    }
  })

  return result
}, tx)
