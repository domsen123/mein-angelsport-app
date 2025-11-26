import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { ulid } from 'ulid'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permitInstance } from '~~/server/database/schema'

export interface GeneratePermitInstancesParams {
  periodId: string
  numberStart: number
  numberEnd: number
}

/**
 * Internal helper to generate permit instances for a period.
 * Creates one instance for each number in the range [numberStart, numberEnd].
 * All instances start with status 'available'.
 *
 * @param params - Period ID and number range
 * @param context - Execution context with userId for audit
 * @param tx - Optional transaction client
 */
export const _generatePermitInstances = async (
  params: GeneratePermitInstancesParams,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const { periodId, numberStart, numberEnd } = params
  const now = new Date()

  // Generate array of instance values
  const instanceValues: (typeof permitInstance.$inferInsert)[] = []

  for (let num = numberStart; num <= numberEnd; num++) {
    instanceValues.push({
      id: ulid(),
      permitOptionPeriodId: periodId,
      permitNumber: num,
      status: 'available',
      createdAt: now,
      updatedAt: now,
      createdBy: context.userId,
      updatedBy: context.userId,
    })
  }

  // Batch insert all instances
  if (instanceValues.length > 0) {
    await db.insert(permitInstance).values(instanceValues)
  }

  return { count: instanceValues.length }
}, tx)
