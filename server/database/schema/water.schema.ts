import { pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth.schema'
import { club } from './club.schema'

export const water = pgTable('water', {
  id: text('id').primaryKey(),

  type: text('type', { enum: ['lotic', 'lentic'] }).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),

  postCode: text('post_code').notNull(),

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
})

export const club_water = pgTable('club_water', {
  clubId: text('club_id').references(() => club.id, { onDelete: 'cascade' }).notNull(),
  waterId: text('water_id').references(() => water.id, { onDelete: 'cascade' }).notNull(),

  validatedAt: timestamp('validated_at', { mode: 'date', withTimezone: true }),
  validatedBy: text('validated_by').references(() => user.id, { onDelete: 'set null' }),
}, t => [
  primaryKey({ columns: [t.clubId, t.waterId] }),
])
