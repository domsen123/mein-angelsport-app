import process from 'node:process'
import dotenv from 'dotenv'

// parse --env argument
const envArg = process.argv.find(arg => arg.startsWith('--dotenv=')) || '--dotenv=.env'
const envFile = envArg.split('=')[1] || '.env'

// Try to load .env file, but don't fail if it doesn't exist in production
const envFound = dotenv.config({
  path: envFile,
})
if (envFound.error && process.env.NODE_ENV !== 'production') {
  throw new Error(`⚠️  Couldn't find ${envFile} file  ⚠️`)
}

process.env.NODE_ENV = process.env.NUXT_SITE_ENV || 'development'

const requiredEnvVars = [
  'NUXT_SITE_NAME',
  'NUXT_SITE_ENV',
  'NUXT_SITE_URL',
  'NUXT_DATABASE_HOST',
  'NUXT_DATABASE_PORT',
  'NUXT_DATABASE_USER',
  'NUXT_DATABASE_PASSWORD',
  'NUXT_DATABASE_NAME',
  'NUXT_AUTH_SECRET',
]

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`⚠️  Missing required environment variable: ${key} ⚠️`)
  }
})

export const config = {
  site: {
    name: process.env.NUXT_SITE_NAME || '',
    env: process.env.NUXT_SITE_ENV || '',
    url: process.env.NUXT_SITE_URL || '',
  },
  database: {
    host: process.env.NUXT_DATABASE_HOST || 'localhost',
    port: Number.parseInt(process.env.NUXT_DATABASE_PORT || '5432'),
    user: process.env.NUXT_DATABASE_USER || 'postgres',
    password: process.env.NUXT_DATABASE_PASSWORD || 'postgres',
    database: process.env.NUXT_DATABASE_NAME || 'mein_angelsport',
    pool_min: Number.parseInt(process.env.NUXT_DB_POOL_MIN || '2'),
    pool_max: Number.parseInt(process.env.NUXT_DB_POOL_MAX || '10'),
  },
  security: {
    auth_secret: process.env.NUXT_AUTH_SECRET || '',
  },
}

export default config
export type Config = typeof config
