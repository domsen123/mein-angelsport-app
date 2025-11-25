import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubEvent } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const GetClubEventByIdCommandSchema = z.object({
  clubId: ulidSchema,
  eventId: ulidSchema,
})

export type GetClubEventByIdCommandInput = z.infer<typeof GetClubEventByIdCommandSchema>

export const _getClubEventById = async (
  input: GetClubEventByIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetClubEventByIdCommandSchema.parse(input)
  const { clubId, eventId } = data

  const event = await db.query.clubEvent.findFirst({
    where: and(
      eq(clubEvent.id, eventId),
      eq(clubEvent.clubId, clubId),
    ),
  })

  if (!event) {
    throw createError({
      statusCode: 404,
      message: 'Event not found',
    })
  }

  return event
}, tx)

export const getClubEventById = async (
  input: GetClubEventByIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getClubEventById(input, context, db)
}, tx)

export type GetClubEventByIdResponse = Awaited<ReturnType<typeof _getClubEventById>>
