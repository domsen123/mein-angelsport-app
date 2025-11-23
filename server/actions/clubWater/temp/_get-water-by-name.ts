import type { DatabaseClient } from '~~/server/database/client'
import { doDatabaseOperation } from '~~/server/database/helper'

export const _getWaterByName = async (name: string, tx?: DatabaseClient) => doDatabaseOperation(async (db) => {
  return await db.query.water.findFirst({
    where: (w, { eq }) => eq(w.name, name),
  })
}, tx)
