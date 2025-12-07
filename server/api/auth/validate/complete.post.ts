import { z } from 'zod'
import { completeMemberValidation } from '~~/server/actions/memberValidation/complete-member-validation'
import { slugSchema } from '~~/server/utils/validation'

const CompleteMemberValidationSchema = z.object({
  clubSlug: slugSchema,
  token: z.string().length(64, 'Ungültiger Token'),
  email: z.email('Ungültige E-Mail-Adresse').trim(),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben').trim(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, data => CompleteMemberValidationSchema.parse(data))

  const result = await completeMemberValidation(body)

  // Set session cookies from auth response
  if (result.headers) {
    for (const [key, value] of Object.entries(result.headers)) {
      setHeader(event, key, value)
    }
  }

  // Return without headers (they're already set)
  const { headers: _, ...response } = result
  return response
})
