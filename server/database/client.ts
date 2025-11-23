import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import config from '../config'
import { buildDatabaseUri } from './helper'
import * as schema from './schema'

const dbAppClient = postgres(buildDatabaseUri(config.database), {
  max: config.database.pool_max,
  idle_timeout: 20,
  connect_timeout: 10,
})

const dbMigrationClient = postgres(buildDatabaseUri(config.database), {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const getDatabase = (client: 'app' | 'migration' = 'app') => {
  switch (client) {
    case 'app':
      return drizzle<typeof schema>(dbAppClient, { schema })
    case 'migration':
      return drizzle<typeof schema>(dbMigrationClient, { schema })
  }
}

export type DatabaseClient = PostgresJsDatabase<typeof schema>
