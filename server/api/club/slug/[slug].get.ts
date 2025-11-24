import { APIError } from 'better-auth'
import z from 'zod'
import { getClubBySlug } from '~~/server/actions/club/get-club-by-slug'
import { createExecutionContext } from '~~/server/types/ExecutionContext'

export const GetClubBySlugCommandSchema = z.object({
  slug: slugSchema,
})

export type GetClubBySlugCommand = z.infer<typeof GetClubBySlugCommandSchema>

export default defineAuthenticatedEventHandler(async (event) => {
  const { slug } = await getValidatedRouterParams(event, params => GetClubBySlugCommandSchema.parse(params))
  const context = createExecutionContext(event)
  try {
    return await getClubBySlug(slug, context)
  }
  catch (error: any) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Beim Abrufen des Vereins ist ein interner Fehler aufgetreten.',
      cause: error,
    })
  }
})
