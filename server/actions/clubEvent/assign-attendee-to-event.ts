import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubEventAttendance } from '~~/server/database/schema'

export const AssignAttendeeToEventCommandSchema = z.object({
  eventId: ulidSchema,
  memberId: ulidSchema,
})

export type AssignAttendeeToEventCommand = z.infer<typeof AssignAttendeeToEventCommandSchema>

export const _assignAttendeeToEvent = async (
  input: AssignAttendeeToEventCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // validation
  const data = AssignAttendeeToEventCommandSchema.parse(input)

  // preperation
  const now = new Date()

  // execution
  const [createdAssignment] = await db
    .insert(clubEventAttendance)
    .values({
      eventId: data.eventId,
      memberId: data.memberId,

      status: 'attended',

      createdAt: now,
      updatedAt: now,
      createdBy: context.userId,
      updatedBy: context.userId,
    })
    .returning()

  return createdAssignment
}, tx)

export const assignAttendeeToEvent = async (
  input: AssignAttendeeToEventCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  return _assignAttendeeToEvent(input, context, db)
}, tx)
