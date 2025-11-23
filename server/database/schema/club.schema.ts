import { relations, sql } from 'drizzle-orm'
import { boolean, index, pgTable, primaryKey, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { user } from './auth.schema'

export const club = pgTable('club', {
  id: text('id').primaryKey(),

  name: text('name').notNull(),
  shortName: text('short_name'),
  slug: text('slug').notNull(),

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
}, t => [
  uniqueIndex('club__slug_idx').on(t.slug),
])

export const clubMember = pgTable('club_member', {
  id: text('id').primaryKey(),

  clubId: text('club_id').references(() => club.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => club.id, { onDelete: 'set null' }),

  firstName: text('first_name'),
  lastName: text('last_name'),
  birthdate: timestamp('birth_date', { mode: 'date' }),
  phone: text('phone'),
  email: text('email'),

  street: text('street'),
  postalCode: text('postal_code'),
  city: text('city'),
  country: text('country').default('Germany'),

  preferredInvoicingMethod: text('preferred_invoicing_method', { enum: ['email', 'postal_mail'] }).default('email').notNull(),

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
}, t => [
  index('club_member__club_id_idx').on(t.clubId),
  uniqueIndex('club_member__unique_club_user_idx').on(t.clubId, t.userId).where(sql`"user_id" is not null`),
])

export const clubRole = pgTable('club_role', {
  id: text('id').primaryKey(),

  clubId: text('club_id').references(() => club.id, { onDelete: 'cascade' }).notNull(),

  name: text('name').notNull(),
  description: text('description'),

  isClubAdmin: boolean('is_club_admin').default(false).notNull(),
  isExemptFromWorkDuties: boolean('is_exempt_from_work_duties').default(false).notNull(),

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
}, t => [
  index('club_role__club_id_idx').on(t.clubId),
  uniqueIndex('club_role__unique_club_name_idx').on(t.clubId, t.name),
])

export const clubMemberRole = pgTable('club_member_role', {
  memberId: text('member_id').references(() => clubMember.id, { onDelete: 'cascade' }).notNull(),
  roleId: text('role_id').references(() => clubRole.id, { onDelete: 'cascade' }).notNull(),

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
}, t => [
  primaryKey({ columns: [t.memberId, t.roleId] }),
])

// RELATIONS
export const clubRoleRelation = relations(clubRole, ({ many, one }) => ({
  club: one(club, { fields: [clubRole.clubId], references: [club.id] }),
  members: many(clubMemberRole),
}))

export const clubMemberRelations = relations(clubMember, ({ one, many }) => ({
  club: one(club, { fields: [clubMember.clubId], references: [club.id] }),
  user: one(user, { fields: [clubMember.userId], references: [user.id] }),
  roles: many(clubMemberRole),
}))

export const clubMemberRoleRelations = relations(clubMemberRole, ({ one }) => ({
  member: one(clubMember, { fields: [clubMemberRole.memberId], references: [clubMember.id] }),
  role: one(clubRole, { fields: [clubMemberRole.roleId], references: [clubRole.id] }),
}))
