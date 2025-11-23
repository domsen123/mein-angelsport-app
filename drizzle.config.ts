import { defineConfig } from 'drizzle-kit'
import config from './server/config'
import { buildDatabaseUri } from './server/database/helper'

export default defineConfig({
  schema: './server/database/schema/*',
  out: './server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: buildDatabaseUri(config.database),
  },
})
