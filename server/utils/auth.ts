import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import { count } from 'drizzle-orm'
import { ulid } from 'ulid'
import config from '../config'
import { getDatabase } from '../database/client'
import { user } from '../database/schema'

export const auth = betterAuth({
  database: drizzleAdapter(getDatabase('app'), {
    provider: 'pg',
  }),
  baseURL: config.site.url,
  secret: config.security.auth_secret,
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ url }) => {
      console.info(`Click the link to reset your password: ${url}`)
    },
    onPasswordReset: async ({ user }) => {
      console.log(`Password for user ${user.email} has been reset.`)
    },
  },
  plugins: [
    admin(),
  ],
  advanced: {
    disableOriginCheck: config.site.env === 'development',
    database: {
      generateId: () => ulid(),
    },
  },
  user: {
    additionalFields: {
      firstName: {
        type: 'string',
        required: false,
      },
      lastName: {
        type: 'string',
        required: false,
      },
      street: {
        type: 'string',
        required: false,
      },
      postalCode: {
        type: 'string',
        required: false,
      },
      city: {
        type: 'string',
        required: false,
      },
      country: {
        type: 'string',
        required: false,
      },
    },
    changeEmail: {
      enabled: true,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (newUser) => {
          const db = getDatabase()
          const countResult = await db.select({ count: count() }).from(user)
          const userCount = countResult[0]?.count ?? 0
          if (userCount === 0) {
            return {
              data: {
                ...newUser,
                role: 'admin',
                emailVerified: true,
              },
            }
          }
          return {
            data: {
              ...newUser,
              firstName: newUser.name.split(' ')[0],
              lastName: newUser.name.split(' ')[1],
            },
          }
        },
      },
    },
  },
})

export type AppUser = typeof auth.$Infer.Session.user
export type AppSession = typeof auth.$Infer.Session
