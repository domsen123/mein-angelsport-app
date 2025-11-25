import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { paginateQuery } from '~~/server/database/pagination'
import { clubEvent } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const GetClubEventsByClubIdCommandSchema = z.object({
  clubId: ulidSchema,
  pagination: paginationSchema,
})

export type GetClubEventsByClubIdCommandInput = z.infer<typeof GetClubEventsByClubIdCommandSchema>

export const _getClubEventsByClubId = async (
  input: GetClubEventsByClubIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetClubEventsByClubIdCommandSchema.parse(input)
  const { clubId, pagination } = data

  const result = await paginateQuery(db, clubEvent, 'clubEvent', pagination, {
    searchableColumns: [clubEvent.name, clubEvent.description],
    sortableColumns: {
      name: clubEvent.name,
      dateStart: clubEvent.dateStart,
      dateEnd: clubEvent.dateEnd,
      isWorkDuty: clubEvent.isWorkDuty,
      isPublic: clubEvent.isPublic,
      createdAt: clubEvent.createdAt,
    },
    baseFilter: eq(clubEvent.clubId, clubId),
  })

  return result
}, tx)

export const getClubEventsByClubId = async (
  input: GetClubEventsByClubIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getClubEventsByClubId(input, context, db)
}, tx)

// Response types for frontend usage
export type GetClubEventsByClubIdResponse = Awaited<ReturnType<typeof _getClubEventsByClubId>>
export type ClubEventItem = GetClubEventsByClubIdResponse['items'][number]
