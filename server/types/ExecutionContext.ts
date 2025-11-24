import type { H3Event } from 'h3'
import type { AppUser } from '../utils/auth'

/**
 * ExecutionContext represents the actor and temporal context of a command execution.
 *
 * This pattern separates:
 * - Command data (what to do) - business logic inputs
 * - Execution context (who is doing it, when) - actor and temporal information
 *
 * Security Benefits:
 * - Prevents user impersonation attacks
 * - Ensures userId comes from authenticated session, not client input
 * - Provides accurate audit trails
 *
 * @property userId - The ID of the authenticated user executing the command
 * @property timestamp - When the command was initiated
 */
export interface ExecutionContext {
  readonly userId: string
  readonly timestamp: Date
}

/**
 * Creates an ExecutionContext from an authenticated H3 event.
 *
 * This factory function extracts the authenticated user ID from the session
 * and captures the current timestamp, ensuring that the execution context
 * reflects the actual authenticated user rather than client-provided data.
 *
 * @param event - The authenticated H3 event containing user session
 * @returns ExecutionContext with userId from session and current timestamp
 *
 * @example
 * ```typescript
 * export default defineAuthenticatedEventHandler(async (event) => {
 *   const body = await readBody(event)
 *   const command = CreateClubCommandSchema.parse(body)
 *   const context = createExecutionContext(event)
 *
 *   return await clubService.createClub(command, context)
 * })
 * ```
 */
export function createExecutionContext(event: H3Event & { context: { user: AppUser } }): ExecutionContext {
  return {
    userId: event.context.user.id,
    timestamp: new Date(),
  }
}

export const createAnonymousExecutionContext = (): ExecutionContext => {
  return {
    userId: '',
    timestamp: new Date(),
  }
}
