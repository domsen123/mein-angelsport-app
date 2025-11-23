import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { getDatabase } from '../database/client'

export default defineNitroPlugin(async () => {
  if (import.meta.dev)
    return

  try {
    await migrate(getDatabase('migration'), {
      migrationsFolder: './server/database/migrations',
    })
    console.info('Database migration completed successfully.')
  }
  catch (error: any) {
    console.error('Database migration failed:', error)
  }
})
