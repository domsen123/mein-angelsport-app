# Shop System - Implementation Specification

## Overview

A permit purchase system where club members can buy permits for themselves or members they manage (e.g., parents for children). The system handles permit selection, work duty fee calculation, discount application, and order management.

---

## Key Business Rules

| Rule | Description |
|------|-------------|
| **One order = One member** | Each order is for a single recipient (the member the permits are for) |
| **Permit sale period** | Permits can only be purchased when `club.permitSaleStart <= today <= club.permitSaleEnd` |
| **One option per permit** | Member can select multiple permits, but only ONE option per permit type |
| **Work duties** | Missing work duties add fees unless member has role with `isExemptFromWorkDuties` |
| **Discounts** | Applied based on recipient's roles (not buyer's), highest discount wins |
| **Reservation** | PermitInstance reserved for 5 minutes during checkout, released if not completed |
| **No cart** | Single-session checkout flow |

---

## Database Schema

### New Tables

#### `club_shop_items`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `clubId` | uuid | FK to clubs |
| `name` | varchar(255) | Item name (e.g., "Aktiv Mitgliedschaft") |
| `description` | text | Optional description |
| `priceCents` | integer | Price in cents (can be 0) |
| `isStandalone` | boolean | Can be bought without permit (OUT OF SCOPE for now) |
| `autoAddOnPermitPurchase` | boolean | Automatically added to permit orders |
| `isActive` | boolean | Enable/disable item |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

#### `club_orders`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `clubId` | uuid | FK to clubs |
| `orderNumber` | varchar(20) | Human-readable: `YYYY-XXXX` |
| `memberId` | uuid | FK to club_members (recipient) |
| `buyerId` | uuid | FK to club_members (who placed the order) |
| `status` | enum | `PENDING`, `PAID`, `FULFILLED`, `CANCELLED` |
| `subtotalCents` | integer | Sum before discounts |
| `discountCents` | integer | Total discount amount |
| `workDutyFeeCents` | integer | Fee for missing work duties |
| `totalCents` | integer | Final amount |
| `shippingAddress` | jsonb | `{ street, zip, city, country }` |
| `externalRef` | varchar(255) | Link to external invoice system |
| `notes` | text | Optional admin notes |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

#### `club_order_items`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `orderId` | uuid | FK to club_orders |
| `itemType` | enum | `PERMIT`, `SHOP_ITEM`, `WORK_DUTY_FEE` |
| `permitInstanceId` | uuid | FK to permit_instances (if type=PERMIT) |
| `shopItemId` | uuid | FK to club_shop_items (if type=SHOP_ITEM) |
| `name` | varchar(255) | Item name at time of purchase |
| `description` | text | Item description at time of purchase |
| `originalPriceCents` | integer | Price before discount |
| `discountPercent` | integer | Applied discount (0-100) |
| `discountCents` | integer | Discount amount |
| `finalPriceCents` | integer | Price after discount |
| `quantity` | integer | Always 1 for permits, can vary for shop items |
| `createdAt` | timestamp | |

### Modified Tables

#### `permit_instances` (add column)

| Column | Type | Description |
|--------|------|-------------|
| `reservedBy` | uuid | FK to club_members (who reserved it) |

*Note: `reservedAt` and `status` columns already exist*

---

## Order Number Generation

Format: `YYYY-XXXX` where:
- `YYYY` = Current year
- `XXXX` = Sequential number per year (padded with zeros)

Example: `2025-0001`, `2025-0002`, etc.

Implementation: Query max order number for current year, increment by 1.

---

## Checkout Flow

### URL Structure

```
/verein/[slug]/shop/                     → Step 1: Permit Selection
/verein/[slug]/shop/work-duties          → Step 2: Work Duty Check
/verein/[slug]/shop/overview             → Step 3: Discounts & Items Review
/verein/[slug]/shop/shipping             → Step 4: Address Confirmation
/verein/[slug]/shop/confirm              → Step 5: Final Review & Order
```

### State Management

Use a composable `useShopCheckout()` to manage checkout state across pages:

```typescript
interface CheckoutState {
  memberId: string              // Who the order is for
  selectedPermits: {
    permitId: string
    optionId: string
    permitInstanceId: string    // Reserved instance
  }[]
  workDutyInfo: {
    required: number
    attended: number
    missing: number
    feePerDuty: number
    totalFee: number
    isExempt: boolean
  }
  discounts: {
    permitOptionId: string
    discountPercent: number
    roleId: string
  }[]
  shippingAddress: {
    street: string
    zip: string
    city: string
    country: string
  }
  reservationExpiresAt: Date
}
```

---

## Page Specifications

### Step 1: Permit Selection (`/verein/[slug]/shop/index.vue`)

**Purpose:** Select which member to buy for and which permits/options to purchase.

**UI Elements:**
1. **Member Selector** (if user manages other members)
   - Dropdown with self + managed members
   - Shows member name and any relevant info

2. **Permit List**
   - Show all permits for current period
   - Each permit shows available options as radio buttons
   - Show price per option
   - Show availability count (from permit_instances)
   - Disable options with no availability

3. **"Continue" Button**
   - Validates at least one permit selected
   - Reserves selected permit instances
   - Navigates to Step 2

**Validation:**
- `club.permitSaleStart <= today <= club.permitSaleEnd`
- At least one permit option selected
- Selected options have available instances

**API Calls:**
- `GET /api/club/[id]/shop/permits` - Get available permits with options and availability
- `POST /api/club/[id]/shop/reserve` - Reserve permit instances

---

### Step 2: Work Duty Check (`/verein/[slug]/shop/work-duties.vue`)

**Purpose:** Show work duty status and calculate fees for missing duties.

**UI Elements:**
1. **Work Duty Summary**
   - Required duties: `club.workDutiesPerYear`
   - Attended duties: Count of `clubEvent.isWorkDuty` events with status `attended` for current year
   - Missing duties: Calculated difference
   - More duties than required equals 0 missing

2. **Fee Calculation** (if not exempt)
   - `X missing work duties × €Y = €Z`
   - Price per duty: `club.workDutyPriceCents`

3. **Exempt Notice** (if member has role with `isExemptFromWorkDuties`)
   - "You are exempt from work duties based on your membership role"
   - No fee calculated

4. **"Continue" Button**
   - Navigates to Step 3

**API Calls:**
- `GET /api/club/[id]/shop/work-duties?memberId=X` - Get work duty status for member

---

### Step 3: Overview with Discounts (`/verein/[slug]/shop/overview.vue`)

**Purpose:** Show all items with discounts applied.

**UI Elements:**
1. **Selected Permits**
   - Permit name + option name
   - Original price
   - Discount (if applicable): "-X% (Role Name)"
   - Final price

2. **Work Duty Fee** (if applicable)
   - "X missing work duties"
   - Fee amount

3. **Auto-Added Items**
   - Items where `autoAddOnPermitPurchase = true`
   - Name + price

4. **Totals**
   - Subtotal (before discounts)
   - Total discounts
   - Work duty fees
   - **Grand Total**

5. **"Continue" Button**
   - Navigates to Step 4

**Discount Logic:**
- For each permit option, check all roles of the member
- Find highest discount percentage from `role_permit_discounts`
- Apply that discount

---

### Step 4: Shipping Address (`/verein/[slug]/shop/shipping.vue`)

**Purpose:** Confirm/enter shipping address.

**UI Elements:**
1. **Address Form**
   - Street (prefilled from `clubMember`)
   - ZIP Code (prefilled from `clubMember`)
   - City (prefilled from `clubMember`)
   - Country (prefilled from `clubMember`, default: "Germany" but hidden for now)

2. **"Continue" Button**
   - Validates all fields filled
   - Navigates to Step 5

**Prefill Logic:**
- Load address from `club_members` table for the selected member
- If managed member has no address, might need to use buyer's address or require input

---

### Step 5: Final Confirmation (`/verein/[slug]/shop/confirm.vue`)

**Purpose:** Review everything and place order.

**UI Elements:**
1. **Order Summary**
   - Member name (recipient)
   - All items with prices
   - Discounts applied
   - Work duty fees
   - Total amount

2. **Shipping Address**
   - Display confirmed address

3. **Reservation Timer**
   - Show countdown: "Complete order within X:XX"
   - Warning when < 1 minute remaining

4. **"Place Order" Button**
   - Creates order
   - Updates permit instances to `sold`
   - Redirects to success page

5. **Success Page** (`/verein/[slug]/shop/success.vue`)
   - Order confirmation
   - Order number
   - Summary of purchase

**API Calls:**
- `POST /api/club/[id]/shop/order` - Create the order

---

## Admin Pages

### Shop Items Management (`/verein/[slug]/_admin/shop/items.vue`)

**Purpose:** CRUD for club shop items.

**UI Elements:**
1. **Items Table**
   - Name, Price, Standalone, Auto-Add, Active
   - Edit/Delete actions

2. **Add/Edit Modal**
   - Name (required)
   - Description (optional)
   - Price in cents
   - Is Standalone (checkbox)
   - Auto-Add on Permit Purchase (checkbox)
   - Is Active (checkbox)

---

### Orders Management (`/verein/[slug]/_admin/shop/orders.vue`)

**Purpose:** View and manage orders.

**UI Elements:**
1. **Orders Table**
   - Order Number
   - Date
   - Member Name
   - Buyer Name (if different)
   - Total
   - Status (with color badge)
   - Actions

2. **Filters**
   - Status filter
   - Date range
   - Search by member/order number

3. **Order Detail Modal/Page**
   - Full order details
   - All items
   - Status change dropdown
   - External Ref input
   - Notes field

---

## API Endpoints

### Shop (Public - Member Access)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/club/[id]/shop/permits` | Get available permits with options and availability |
| GET | `/api/club/[id]/shop/work-duties` | Get work duty status for member |
| POST | `/api/club/[id]/shop/reserve` | Reserve permit instances (5 min hold) |
| POST | `/api/club/[id]/shop/order` | Create order and finalize purchase |
| GET | `/api/club/[id]/shop/order/[orderId]` | Get order details |

### Shop Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/club/[id]/_admin/shop/items` | List shop items |
| POST | `/api/club/[id]/_admin/shop/items` | Create shop item |
| PUT | `/api/club/[id]/_admin/shop/items/[itemId]` | Update shop item |
| DELETE | `/api/club/[id]/_admin/shop/items/[itemId]` | Delete shop item |
| GET | `/api/club/[id]/_admin/shop/orders` | List orders (paginated) |
| GET | `/api/club/[id]/_admin/shop/orders/[orderId]` | Get order details |
| PATCH | `/api/club/[id]/_admin/shop/orders/[orderId]` | Update order (status, externalRef, notes) |

---

## Background Tasks

### Release Expired Reservations

**Task:** `tasks/release-expired-reservations.ts`

**Schedule:** Every minute (cron)

**Logic:**
```sql
UPDATE permit_instances
SET status = 'available', reservedBy = NULL, reservedAt = NULL
WHERE status = 'reserved'
AND reservedAt < NOW() - INTERVAL '5 minutes'
```

**Implementation:** Use Nitro Tasks (https://nitro.build/guide/tasks)

---

## Edge Cases & Validation

### Permit Selection
- [ ] Check permit sale period before showing shop
- [ ] Validate permit instance availability before reservation
- [ ] Handle concurrent reservations (use transactions)
- [ ] Block if member already has permit for same period

### Checkout Flow
- [ ] Redirect to Step 1 if no state/reservation exists
- [ ] Check reservation validity on each step
- [ ] Handle expired reservation (show message, redirect to Step 1)
- [ ] Prevent double-submission of order

### Work Duties
- [ ] Only count events from current year
- [ ] Only count events with `isWorkDuty = true` and participation status `attended`
- [ ] Check `isExemptFromWorkDuties` flag on member's roles

### Discounts
- [ ] Apply highest discount when member has multiple roles
- [ ] Store discount info at time of purchase (don't recalculate later)

### Orders
- [ ] Generate unique order number (handle race conditions)
- [ ] Validate all items still available before creating order
- [ ] Update permit instances to `sold` in same transaction as order creation

---

## Implementation Tasks

### Phase 1: Database & Backend Foundation
- [ ] Create `club_shop_items` table and schema
- [ ] Create `club_orders` table and schema
- [ ] Create `club_order_items` table and schema
- [ ] Add `reservedBy` column to `permit_instances`
- [ ] Create order number generation function

### Phase 2: Admin Pages
- [ ] Shop Items CRUD page (`/_admin/shop/items`)
- [ ] Shop Items API endpoints
- [ ] Orders list page (`/_admin/shop/orders`)
- [ ] Order detail view/edit
- [ ] Orders API endpoints

### Phase 3: Shop Checkout Flow
- [ ] Create `useShopCheckout` composable for state management
- [ ] Step 1: Permit Selection page + API
- [ ] Step 2: Work Duties page + API
- [ ] Step 3: Overview/Discounts page
- [ ] Step 4: Shipping Address page
- [ ] Step 5: Confirmation page + Order creation API
- [ ] Success page

### Phase 4: Background Tasks & Polish
- [ ] Implement reservation release task (Nitro Task)
- [ ] Add reservation timer UI component
- [ ] Handle edge cases and error states
- [ ] Testing

---

## Out of Scope (Future)

- [ ] Standalone shop item purchases (without permit)
- [ ] Email confirmations
- [ ] "Aktiv Mitgliedschaft" automatic role assignment
- [ ] Payment integration
- [ ] PDF invoice generation

---

## Open Questions / Decisions Log

| Date | Question | Decision |
|------|----------|----------|
| 2025-01-XX | Where to store shop items? | New `club_shop_items` table |
| 2025-01-XX | One order for multiple members? | No, one order per member |
| 2025-01-XX | Order statuses? | PENDING, PAID, FULFILLED, CANCELLED |
| 2025-01-XX | Reservation time? | 5 minutes |
| 2025-01-XX | Order number format? | YYYY-XXXX |
| 2025-01-XX | Standalone items? | Out of scope for now |
| 2025-01-XX | Email confirmations? | Out of scope for now |
