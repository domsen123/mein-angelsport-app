import type { EventHandler, EventHandlerRequest, H3Event } from 'h3'
import { isAuthenticated } from '../guards/is-authenticated'

type User = typeof auth.$Infer.Session.user

export interface AuthenticatedH3Event extends H3Event {
  context: H3Event['context'] & {
    user: User
  }
}

export function defineAuthenticatedEventHandler<
  Request extends EventHandlerRequest = EventHandlerRequest,
  D = any,
>(
  handler: ((event: AuthenticatedH3Event) => D | Promise<D>) | {
    onRequest?: EventHandler[]
    handler: (event: AuthenticatedH3Event) => D | Promise<D>
  },
): EventHandler<Request, D> {
  if (typeof handler === 'function') {
    return defineEventHandler({
      onRequest: [isAuthenticated],
      handler: handler as EventHandler,
    })
  }

  return defineEventHandler({
    onRequest: [
      isAuthenticated,
      ...(handler.onRequest || []),
    ],
    handler: handler.handler as EventHandler,
  })
}
