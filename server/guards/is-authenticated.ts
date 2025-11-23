import type { H3Event } from 'h3'
import { APIError } from 'better-auth'

export const isAuthenticated = (event: H3Event) => {
  if (!event.context.user) {
    throw new APIError('UNAUTHORIZED', {
      message: 'User is not authenticated',
      data: {},
    })
  }
}
