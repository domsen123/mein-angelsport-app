import { relations, sql } from 'drizzle-orm'
import { boolean, index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { user } from './auth.schema'
import { clubRolePermitDiscount } from './permit.schema'

export const club = pgTable('club', {
  id: text('id').primaryKey(),

  name: text('name').notNull(),
  shortName: text('short_name'),
  slug: text('slug').notNull(),

  workDutiesPerYear: integer('work_duties_per_year').default(0),
  workDutyPriceCents: text('work_duty_price_in_cents'),

  permitSaleStart: text('permit_sale_start'), // DD-MM
  permitSaleEnd: text('permit_sale_end'), // DD-MM

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
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  managedBy: text('managed_by'),

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

  // Member validation token for account linking
  validationToken: text('validation_token'),
  validationTokenExpiresAt: timestamp('validation_token_expires_at', { mode: 'date', withTimezone: true }),

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

export const clubEvent = pgTable('club_event', {
  id: text('id').primaryKey(),

  clubId: text('club_id').references(() => club.id, { onDelete: 'cascade' }).notNull(),

  name: text('name').notNull(),
  description: text('description'),

  content: text('content'),

  dateStart: timestamp('date_start', { mode: 'date', withTimezone: true }).notNull(),
  dateEnd: timestamp('date_end', { mode: 'date', withTimezone: true }),

  isWorkDuty: boolean('is_work_duty').default(false).notNull(),
  isPublic: boolean('is_public').default(true).notNull(),

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
})

export const clubEventAttendance = pgTable('club_event_attendance', {
  eventId: text('event_id').references(() => clubEvent.id, { onDelete: 'cascade' }).notNull(),
  memberId: text('member_id').references(() => clubMember.id, { onDelete: 'cascade' }).notNull(),

  status: text('status', { enum: ['invited', 'declined', 'accepted', 'attended'] }).notNull(),

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
}, t => [
  primaryKey({ columns: [t.eventId, t.memberId] }),
])

// RELATIONS
export const clubRoleRelation = relations(clubRole, ({ many, one }) => ({
  club: one(club, { fields: [clubRole.clubId], references: [club.id] }),
  members: many(clubMemberRole),
  permitDiscounts: many(clubRolePermitDiscount),
}))

export const clubMemberRelations = relations(clubMember, ({ one, many }) => ({
  club: one(club, { fields: [clubMember.clubId], references: [club.id] }),
  user: one(user, { fields: [clubMember.userId], references: [user.id] }),
  managedByMember: one(clubMember, { fields: [clubMember.managedBy], references: [clubMember.id], relationName: 'managedByMember' }),
  managedMembers: many(clubMember, { relationName: 'managedByMember' }),
  roles: many(clubMemberRole),
}))

export const clubMemberRoleRelations = relations(clubMemberRole, ({ one }) => ({
  member: one(clubMember, { fields: [clubMemberRole.memberId], references: [clubMember.id] }),
  role: one(clubRole, { fields: [clubMemberRole.roleId], references: [clubRole.id] }),
}))

export const clubEventRelations = relations(clubEvent, ({ one, many }) => ({
  club: one(club, { fields: [clubEvent.clubId], references: [club.id] }),
  attendances: many(clubEventAttendance),
}))

export const clubEventAttendanceRelations = relations(clubEventAttendance, ({ one }) => ({
  event: one(clubEvent, { fields: [clubEventAttendance.eventId], references: [clubEvent.id] }),
  member: one(clubMember, { fields: [clubEventAttendance.memberId], references: [clubMember.id] }),
}))
