import { relations } from 'drizzle-orm'
import { index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { user } from './auth.schema'
import { club, clubMember, clubRole } from './club.schema'
import { water } from './water.schema'

export const permit = pgTable('permit', {
  id: text('id').primaryKey(),

  clubId: text('club_id').references(() => club.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
})

export const permitWater = pgTable('permit_water', {
  permitId: text('permit_id').references(() => permit.id, { onDelete: 'cascade' }).notNull(),
  waterId: text('water_id').references(() => water.id, { onDelete: 'cascade' }).notNull(),
}, t => [
  primaryKey({ columns: [t.permitId, t.waterId] }),
  index('permit_water__water_id_idx').on(t.waterId),
])

export const permitOption = pgTable('permit_option', {
  id: text('id').primaryKey(),

  permitId: text('permit_id').references(() => permit.id, { onDelete: 'cascade' }).notNull(),

  name: text('name'),
  description: text('description'),

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
}, t => [
  index('permit_option__permit_id_idx').on(t.permitId),
])

export const permitOptionPeriod = pgTable('permit_option_period', {
  id: text('id').primaryKey(),

  permitOptionId: text('permit_option_id').references(() => permitOption.id, { onDelete: 'cascade' }).notNull(),

  validFrom: timestamp('date_start', { mode: 'date', withTimezone: true }).notNull(),
  validTo: timestamp('date_end', { mode: 'date', withTimezone: true }).notNull(),

  priceCents: text('price_cents').notNull(),

  permitNumberStart: integer('permit_number_start').notNull(),
  permitNumberEnd: integer('permit_number_end').notNull(),

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
}, t => [
  index('permit_option_period__permit_option_id_idx').on(t.permitOptionId),
])

export const permitInstance = pgTable('permit_instance', {
  id: text('id').primaryKey(),

  // Zuordnung zur Periode (definiert Preis, Gültigkeit, etc.)
  permitOptionPeriodId: text('permit_option_period_id')
    .references(() => permitOptionPeriod.id, { onDelete: 'restrict' })
    .notNull(),

  // Eindeutige Nummer innerhalb des definierten Bereichs
  permitNumber: integer('permit_number').notNull(),

  // Status der Karte
  status: text('status', { enum: ['available', 'reserved', 'sold', 'cancelled'] }).notNull(), // 'available', 'reserved', 'sold', 'cancelled'

  // Käufer-Informationen (optional bis zum Kauf)
  buyerId: text('buyer_id').references(() => user.id, { onDelete: 'set null' }),

  ownerMemberId: text('owner_member_id').references(() => clubMember.id, { onDelete: 'set null' }),
  ownerName: text('owner_name'),
  ownerEmail: text('owner_email'),
  ownerPhone: text('owner_phone'),

  // Reservierung
  reservedBy: text('reserved_by').references(() => clubMember.id, { onDelete: 'set null' }),

  // Zeitpunkte
  reservedAt: timestamp('reserved_at', { mode: 'date', withTimezone: true }),
  soldAt: timestamp('sold_at', { mode: 'date', withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { mode: 'date', withTimezone: true }),

  // Zahlungsinformationen
  paymentReference: text('payment_reference'),
  paidCents: text('paid_cents'), // Tatsächlich bezahlter Preis (falls Rabatte)

  // Notizen
  notes: text('notes'),

  // Standard Audit-Felder
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
}, t => [
  uniqueIndex('permit_instance__unique_permit_number_idx').on(t.permitOptionPeriodId, t.permitNumber),
  index('permit_instance__status_idx').on(t.status),
  index('permit_instance__buyer_id_idx').on(t.buyerId),
  index('permit_instance__owner_member_id_idx').on(t.ownerMemberId),
  index('permit_instance__reserved_by_idx').on(t.reservedBy),
])

export const clubRolePermitDiscount = pgTable('club_role_permit_discount', {
  id: text('id').primaryKey(),

  clubRoleId: text('club_role_id').references(() => clubRole.id, { onDelete: 'cascade' }).notNull(),
  permitOptionId: text('permit_option_id').references(() => permitOption.id, { onDelete: 'cascade' }).notNull(),

  discountPercent: integer('discount_percent').notNull(), // 0-100

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
}, t => [
  uniqueIndex('club_role_permit_discount__unique_idx').on(t.clubRoleId, t.permitOptionId),
  index('club_role_permit_discount__club_role_id_idx').on(t.clubRoleId),
  index('club_role_permit_discount__permit_option_id_idx').on(t.permitOptionId),
])

// Relations

export const permitRelations = relations(permit, ({ one, many }) => ({
  club: one(club, { fields: [permit.clubId], references: [club.id] }),
  waters: many(permitWater),
  options: many(permitOption),
}))

export const permitWaterRelations = relations(permitWater, ({ one }) => ({
  permit: one(permit, { fields: [permitWater.permitId], references: [permit.id] }),
  water: one(water, { fields: [permitWater.waterId], references: [water.id] }),
}))

export const permitOptionRelations = relations(permitOption, ({ one, many }) => ({
  permit: one(permit, { fields: [permitOption.permitId], references: [permit.id] }),
  periods: many(permitOptionPeriod),
  roleDiscounts: many(clubRolePermitDiscount),
}))

export const permitOptionPeriodRelations = relations(permitOptionPeriod, ({ one, many }) => ({
  option: one(permitOption, { fields: [permitOptionPeriod.permitOptionId], references: [permitOption.id] }),
  instances: many(permitInstance),
}))

export const permitInstanceRelations = relations(permitInstance, ({ one }) => ({
  optionPeriod: one(permitOptionPeriod, { fields: [permitInstance.permitOptionPeriodId], references: [permitOptionPeriod.id] }),
  buyer: one(user, { fields: [permitInstance.buyerId], references: [user.id] }),
  ownerMember: one(clubMember, { fields: [permitInstance.ownerMemberId], references: [clubMember.id] }),
  reservedByMember: one(clubMember, { fields: [permitInstance.reservedBy], references: [clubMember.id] }),
}))

export const clubRolePermitDiscountRelations = relations(clubRolePermitDiscount, ({ one }) => ({
  clubRole: one(clubRole, { fields: [clubRolePermitDiscount.clubRoleId], references: [clubRole.id] }),
  permitOption: one(permitOption, { fields: [clubRolePermitDiscount.permitOptionId], references: [permitOption.id] }),
}))
