import { relations } from 'drizzle-orm'
import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { user } from './auth.schema'
import { club, clubMember } from './club.schema'
import { permitInstance } from './permit.schema'

// Types
export interface ShippingAddress {
  street: string
  postalCode: string
  city: string
  country: string
}

// Enums
export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'PAID', 'FULFILLED', 'CANCELLED'])
export const orderItemTypeEnum = pgEnum('order_item_type', ['PERMIT', 'SHOP_ITEM', 'WORK_DUTY_FEE'])

// Tables
export const clubShopItem = pgTable('club_shop_item', {
  id: text('id').primaryKey(),

  clubId: text('club_id').references(() => club.id, { onDelete: 'cascade' }).notNull(),

  name: text('name').notNull(),
  description: text('description'),

  priceCents: integer('price_cents').notNull().default(0),

  isStandalone: boolean('is_standalone').notNull().default(false),
  autoAddOnPermitPurchase: boolean('auto_add_on_permit_purchase').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
}, t => [
  index('club_shop_item__club_id_idx').on(t.clubId),
])

export const clubOrder = pgTable('club_order', {
  id: text('id').primaryKey(),

  clubId: text('club_id').references(() => club.id, { onDelete: 'cascade' }).notNull(),

  orderNumber: text('order_number').notNull(),

  // Recipient - the member the order is for
  memberId: text('member_id').references(() => clubMember.id, { onDelete: 'restrict' }).notNull(),
  // Buyer - who placed the order (can be different from recipient, e.g., parent buying for child)
  buyerId: text('buyer_id').references(() => clubMember.id, { onDelete: 'restrict' }).notNull(),

  status: orderStatusEnum('status').notNull().default('PENDING'),

  subtotalCents: integer('subtotal_cents').notNull(),
  discountCents: integer('discount_cents').notNull().default(0),
  workDutyFeeCents: integer('work_duty_fee_cents').notNull().default(0),
  totalCents: integer('total_cents').notNull(),

  shippingAddress: jsonb('shipping_address').$type<ShippingAddress>(),

  externalRef: text('external_ref'),
  notes: text('notes'),

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
}, t => [
  index('club_order__club_id_idx').on(t.clubId),
  index('club_order__member_id_idx').on(t.memberId),
  index('club_order__buyer_id_idx').on(t.buyerId),
  index('club_order__status_idx').on(t.status),
  uniqueIndex('club_order__club_order_number_idx').on(t.clubId, t.orderNumber),
])

export const clubOrderItem = pgTable('club_order_item', {
  id: text('id').primaryKey(),

  orderId: text('order_id').references(() => clubOrder.id, { onDelete: 'cascade' }).notNull(),

  itemType: orderItemTypeEnum('item_type').notNull(),

  // References (nullable depending on itemType)
  permitInstanceId: text('permit_instance_id').references(() => permitInstance.id, { onDelete: 'set null' }),
  shopItemId: text('shop_item_id').references(() => clubShopItem.id, { onDelete: 'set null' }),

  // Snapshot of item at time of purchase
  name: text('name').notNull(),
  description: text('description'),

  // Pricing
  originalPriceCents: integer('original_price_cents').notNull(),
  discountPercent: integer('discount_percent').notNull().default(0),
  discountCents: integer('discount_cents').notNull().default(0),
  finalPriceCents: integer('final_price_cents').notNull(),

  quantity: integer('quantity').notNull().default(1),

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
}, t => [
  index('club_order_item__order_id_idx').on(t.orderId),
  index('club_order_item__permit_instance_id_idx').on(t.permitInstanceId),
  index('club_order_item__shop_item_id_idx').on(t.shopItemId),
])

// Relations
export const clubShopItemRelations = relations(clubShopItem, ({ one }) => ({
  club: one(club, { fields: [clubShopItem.clubId], references: [club.id] }),
}))

export const clubOrderRelations = relations(clubOrder, ({ one, many }) => ({
  club: one(club, { fields: [clubOrder.clubId], references: [club.id] }),
  member: one(clubMember, { fields: [clubOrder.memberId], references: [clubMember.id], relationName: 'orderRecipient' }),
  buyer: one(clubMember, { fields: [clubOrder.buyerId], references: [clubMember.id], relationName: 'orderBuyer' }),
  items: many(clubOrderItem),
}))

export const clubOrderItemRelations = relations(clubOrderItem, ({ one }) => ({
  order: one(clubOrder, { fields: [clubOrderItem.orderId], references: [clubOrder.id] }),
  permitInstance: one(permitInstance, { fields: [clubOrderItem.permitInstanceId], references: [permitInstance.id] }),
  shopItem: one(clubShopItem, { fields: [clubOrderItem.shopItemId], references: [clubShopItem.id] }),
}))
