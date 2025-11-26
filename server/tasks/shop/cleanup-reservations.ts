import { and, isNotNull, lt, sql } from 'drizzle-orm'
import { getDatabase } from '~~/server/database/client'
import { permitInstance } from '~~/server/database/schema'

// Reservation duration in minutes (must match reserve-permits.ts)
const RESERVATION_MINUTES = 5

export default defineTask({
  meta: {
    name: 'shop:cleanup-reservations',
    description: 'Clean up expired permit reservations',
  },
  async run() {
    console.log('[shop:cleanup-reservations] Starting cleanup task')
    const db = getDatabase()

    // Clear reservations where reservedAt + 5 minutes < now
    const expired = await db
      .update(permitInstance)
      .set({
        status: 'available',
        reservedBy: null,
        reservedAt: null,
      })
      .where(
        and(
          isNotNull(permitInstance.reservedBy),
          isNotNull(permitInstance.reservedAt),
          // reservedAt + 5 minutes < now
          lt(
            sql`${permitInstance.reservedAt} + interval '${sql.raw(String(RESERVATION_MINUTES))} minutes'`,
            sql`now()`,
          ),
        ),
      )
      .returning({
        id: permitInstance.id,
      })

    if (expired.length > 0) {
      console.log(`[shop:cleanup-reservations] Cleared ${expired.length} expired reservation(s)`)
    }

    return {
      result: `Cleared ${expired.length} expired reservation(s)`,
    }
  },
})
