import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { ulid } from 'ulid'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubEvent } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const CreateClubEventSchema = z.object({
  clubId: ulidSchema,

  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  content: z.string().optional(),

  dateStart: z.iso.datetime(),
  dateEnd: z.iso.datetime().optional(),

  isWorkDuty: z.boolean().optional().default(false),
  isPublic: z.boolean().optional().default(true),
})

export type CreateClubEventCommand = z.infer<typeof CreateClubEventSchema>

export const _createClubEvent = async (
  input: CreateClubEventCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // validation
  const data = CreateClubEventSchema.parse(input)

  // preparation
  const now = new Date()
  const eventId = ulid()

  // execution
  const [createdEvent] = await db
    .insert(clubEvent)
    .values({
      id: eventId,
      clubId: data.clubId,
      name: data.name,
      description: data.description,
      content: data.content,

      dateStart: new Date(data.dateStart),
      dateEnd: data.dateEnd ? new Date(data.dateEnd) : undefined,

      isWorkDuty: data.isWorkDuty,
      isPublic: data.isPublic,

      createdAt: now,
      updatedAt: now,
      createdBy: context.userId,
      updatedBy: context.userId,
    })
    .returning()

  return createdEvent
}, tx)

export const createClubEvent = async (
  input: CreateClubEventCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _createClubEvent(input, context, db)
}, tx)
