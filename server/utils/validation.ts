import { z } from 'zod'

/**
 * Validates ULID format (26 characters, base32 encoded)
 */
export const ulidSchema = z
  .string()
  .length(26, 'ULID muss 26 Zeichen lang sein')
  .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, 'Ungültiges ULID-Format')

/**
 * Validates positive integers
 */
export const positiveIntSchema = z.number().int().positive({ message: 'Must be a positive integer' })

/**
 * Validates non-negative integers (including zero)
 */
export const nonNegativeIntSchema = z.number().int().nonnegative({ message: 'Must be a non-negative integer' })

/**
 * Validates dates in YYYY-MM-DD format
 */
export const dateNotimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')

/**
 * Validates phone numbers (+x(x) xxx xxxxxxx)
 */
export const validPhoneNumber = z.string().startsWith('+').min(7).max(15)
/**
 * Validates slugs (URL-friendly strings)
 */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  searchTerm: z.string().max(100).default('').optional(),
  orderBy: z.array(z.string()).default([]).optional(),
})

export type PaginationParams = z.infer<typeof paginationSchema>

export interface PaginationOutput<T = any> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}
