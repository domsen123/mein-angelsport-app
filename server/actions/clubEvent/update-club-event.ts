import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubEvent } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const UpdateClubEventCommandSchema = z.object({
  clubId: ulidSchema,
  eventId: ulidSchema,
  name: z.string().min(1, 'Eventname ist erforderlich').max(100, 'Eventname darf 100 Zeichen nicht überschreiten').trim(),
  description: z.string().max(500, 'Beschreibung darf 500 Zeichen nicht überschreiten').trim().optional().nullable(),
  content: z.string().trim().optional().nullable(),
  dateStart: z.iso.datetime(),
  dateEnd: z.iso.datetime().optional().nullable(),
  isWorkDuty: z.boolean().optional().default(false),
  isPublic: z.boolean().optional().default(true),
})

export type UpdateClubEventCommand = z.infer<typeof UpdateClubEventCommandSchema>

export const _updateClubEvent = async (
  input: UpdateClubEventCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = UpdateClubEventCommandSchema.parse(input)

  const [updatedEvent] = await db
    .update(clubEvent)
    .set({
      name: data.name,
      description: data.description || null,
      content: data.content || null,
      dateStart: new Date(data.dateStart),
      dateEnd: data.dateEnd ? new Date(data.dateEnd) : null,
      isWorkDuty: data.isWorkDuty,
      isPublic: data.isPublic,
      updatedBy: context.userId,
      updatedAt: new Date(),
    })
    .where(and(
      eq(clubEvent.id, data.eventId),
      eq(clubEvent.clubId, data.clubId),
    ))
    .returning()

  if (!updatedEvent) {
    throw createError({
      statusCode: 404,
      message: 'Event not found',
    })
  }

  return updatedEvent
}, tx)

export const updateClubEvent = async (
  input: UpdateClubEventCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _updateClubEvent(input, context, db)
}, tx)
