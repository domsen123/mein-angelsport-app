import { z } from 'zod'
import { verifyMemberValidation } from '~~/server/actions/memberValidation/verify-member-validation'
import { slugSchema } from '~~/server/utils/validation'

const VerifyMemberSchema = z.object({
  clubSlug: slugSchema,
  firstName: z.string().min(1, 'Vorname ist erforderlich').max(100).trim(),
  lastName: z.string().min(1, 'Nachname ist erforderlich').max(100).trim(),
  birthdate: z.coerce.date(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, data => VerifyMemberSchema.parse(data))
  return await verifyMemberValidation(body)
})
