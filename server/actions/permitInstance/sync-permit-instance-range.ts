import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq, inArray } from 'drizzle-orm'
import { ulid } from 'ulid'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permitInstance } from '~~/server/database/schema'

export interface SyncPermitInstanceRangeParams {
  periodId: string
  newStart: number
  newEnd: number
}

/**
 * Internal helper to synchronize permit instances when a period's number range changes.
 *
 * - Adds new instances for numbers in the new range that don't exist
 * - Deletes instances outside the new range ONLY if they have status 'available'
 * - Protects instances with status 'reserved', 'sold', or 'cancelled' (business history)
 *
 * @param params - Period ID and new number range
 * @param context - Execution context with userId for audit
 * @param tx - Optional transaction client
 */
export const _syncPermitInstanceRange = async (
  params: SyncPermitInstanceRangeParams,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const { periodId, newStart, newEnd } = params
  const now = new Date()

  // Get all current instances for this period
  const existingInstances = await db.query.permitInstance.findMany({
    where: eq(permitInstance.permitOptionPeriodId, periodId),
    columns: {
      id: true,
      permitNumber: true,
      status: true,
    },
  })

  // Build a map of existing permit numbers to their instance data
  const existingMap = new Map<number, { id: string, status: string }>()
  for (const instance of existingInstances) {
    existingMap.set(instance.permitNumber, { id: instance.id, status: instance.status })
  }

  // Calculate the new range as a set
  const newRangeSet = new Set<number>()
  for (let num = newStart; num <= newEnd; num++) {
    newRangeSet.add(num)
  }

  // Find numbers to ADD (in new range but not existing)
  const numbersToAdd: number[] = []
  for (let num = newStart; num <= newEnd; num++) {
    if (!existingMap.has(num)) {
      numbersToAdd.push(num)
    }
  }

  // Find instances to DELETE (outside new range AND status = 'available')
  const instanceIdsToDelete: string[] = []
  for (const [num, instance] of existingMap) {
    if (!newRangeSet.has(num) && instance.status === 'available') {
      instanceIdsToDelete.push(instance.id)
    }
  }

  // Batch delete removable instances
  if (instanceIdsToDelete.length > 0) {
    await db.delete(permitInstance).where(
      and(
        inArray(permitInstance.id, instanceIdsToDelete),
        eq(permitInstance.status, 'available'), // Extra safety
      ),
    )
  }

  // Batch insert new instances
  if (numbersToAdd.length > 0) {
    const newInstances: (typeof permitInstance.$inferInsert)[] = numbersToAdd.map(num => ({
      id: ulid(),
      permitOptionPeriodId: periodId,
      permitNumber: num,
      status: 'available' as const,
      createdAt: now,
      updatedAt: now,
      createdBy: context.userId,
      updatedBy: context.userId,
    }))

    await db.insert(permitInstance).values(newInstances)
  }

  return {
    added: numbersToAdd.length,
    deleted: instanceIdsToDelete.length,
  }
}, tx)
