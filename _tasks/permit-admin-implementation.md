# Permit Instance Generation System

## Status Overview

**Phases 1-9: ✅ COMPLETE** - All permit admin CRUD functionality is implemented:
- Server actions, API endpoints, client-side queries/mutations
- List page, form page, options/periods components
- Waters assignment, validation, navigation

**Phase 10: ✅ COMPLETE** - Permit Instance Generation:
- Server actions: generate, sync, get (paginated), get by id, update
- Period actions modified: auto-generate on create, sync on update, protect on delete
- API endpoints: GET list, GET single, PUT update
- Client code: api methods, queries, mutations with cache invalidation
- UI: form composable, slideover, instances list page
- Navigation: ticket icon button in PermitPeriodItem links to instances

---

## RULES - Business Logic & Rationale

### Why Permit Instances Exist

A fishing club sells **Erlaubnisscheine** (fishing permits/cards). Each physical permit card has a unique number printed on it. The club needs to:

1. **Pre-allocate permit numbers** - Define a range (e.g., cards #1 through #100) for each selling period
2. **Track each card individually** - Know which card number is available, reserved, or sold
3. **Assign cards to members** - Record who owns which specific permit number
4. **Enable future e-commerce** - Allow members to "reserve" a card when adding to cart before payment

### Data Model Hierarchy

```
permit (e.g., "Jahreserlaubnis 2024")
  └── permitOption (e.g., "Erwachsene", "Jugendliche")
        └── permitOptionPeriod (e.g., "Jan-Dec 2024, cards 1-100, €50")
              └── permitInstance (e.g., "Card #42, sold to Max Mustermann")
```

### Business Rules

1. **Generation Timing**: Instances are created **immediately when a period is created**
   - This reserves the number range and makes cards available for sale/assignment
   - Admins can see all available cards right away

2. **Number Format**: Simple integers matching the physical cards
   - If `permitNumberStart=1` and `permitNumberEnd=100`, create instances with `permitNumber` = "1", "2", ... "100"

3. **Status Workflow**:
   - `available` → Card exists but not assigned to anyone
   - `reserved` → Card is in someone's cart or temporarily held (future e-commerce)
   - `sold` → Card has been purchased/assigned to a member
   - `cancelled` → Card was sold but later cancelled/returned

4. **Range Changes** (when admin updates permitNumberStart/End):
   - **Add**: Create new instances for numbers not yet existing
   - **Remove**: Only delete instances with status `'available'`
   - **Protect**: Never delete `reserved`, `sold`, or `cancelled` instances (they have business history)

5. **Period Deletion Protection**:
   - Cannot delete a period if any instances are `reserved`, `sold`, or `cancelled`
   - This protects sales history and member assignments

### Admin Use Cases

- **View all cards for a period**: See which numbers are available vs. sold
- **Manually assign card**: Admin sells card in-person, records the sale
- **Track member assignments**: See which member owns which card number
- **Handle cancellations**: Mark a sold card as cancelled if member returns it
- **Add notes**: Record special circumstances (e.g., "Discounted for senior")

---

## Implementation Plan

### Phase 10.1: Server Actions for Permit Instances

#### 10.1.1 Generate Permit Instances Helper
**File**: `server/actions/permitInstance/generate-permit-instances.ts`

- [x] Create internal helper function `_generatePermitInstances`
- [x] Parameters: `periodId`, `numberStart`, `numberEnd`, `context`, `tx`
- [x] Loop from `numberStart` to `numberEnd`, create instance for each
- [x] Use `ulid()` for each instance ID
- [x] All instances start as status `'available'`
- [x] Store permit numbers as strings (e.g., `"1"`, `"42"`)

#### 10.1.2 Sync Instance Range Helper
**File**: `server/actions/permitInstance/sync-permit-instance-range.ts`

- [x] Create internal helper function `_syncPermitInstanceRange`
- [x] Parameters: `periodId`, `newStart`, `newEnd`, `context`, `tx`
- [x] Query current instances for period with their `permitNumber` and `status`
- [x] Calculate numbers to ADD (in new range but not existing)
- [x] Calculate instances to DELETE (outside new range AND status = `'available'`)
- [x] Batch delete removable instances using `inArray()` + `and()` conditions
- [x] Batch insert new instances

#### 10.1.3 Get Permit Instances by Period ID (Paginated)
**File**: `server/actions/permitInstance/get-permit-instances-by-period-id.ts`

- [x] Create `GetPermitInstancesByPeriodIdCommandSchema` with validation
- [x] Use `paginateQuery` helper with:
  - `searchableColumns`: `[permitInstance.permitNumber, permitInstance.ownerName, permitInstance.ownerEmail]`
  - `sortableColumns`: `{ permitNumber, status, ownerName, soldAt, createdAt }`
  - `baseFilter`: `eq(permitInstance.permitOptionPeriodId, periodId)`
  - `with`: `{ ownerMember: true, buyer: true }`
- [x] Add `isExecutorClubAdmin` authorization check
- [x] Export response types

#### 10.1.4 Get Permit Instance by ID
**File**: `server/actions/permitInstance/get-permit-instance-by-id.ts`

- [x] Create `GetPermitInstanceByIdCommandSchema`
- [x] Query single instance with relations (`ownerMember`, `buyer`, `optionPeriod`)
- [x] Add authorization check
- [x] Export response types

#### 10.1.5 Update Permit Instance
**File**: `server/actions/permitInstance/update-permit-instance.ts`

- [x] Create `UpdatePermitInstanceCommandSchema` with fields:
  - `status`: optional enum `['available', 'reserved', 'sold', 'cancelled']`
  - `ownerMemberId`: optional string | null
  - `ownerName`, `ownerEmail`, `ownerPhone`: optional string | null
  - `paymentReference`, `paidCents`, `notes`: optional string | null
- [x] Auto-set timestamps on status change:
  - `'reserved'` → set `reservedAt = now`
  - `'sold'` → set `soldAt = now`
  - `'cancelled'` → set `cancelledAt = now`
- [x] Add authorization check

---

### Phase 10.2: Modify Existing Period Actions

#### 10.2.1 Modify Create Period
**File**: `server/actions/permit/create-permit-option-period.ts`

- [x] Import `_generatePermitInstances` helper
- [x] After inserting period, call helper with number range
- [x] All within same transaction (pass `db` as `tx`)

#### 10.2.2 Modify Update Period
**File**: `server/actions/permit/update-permit-option-period.ts`

- [x] Import `_syncPermitInstanceRange` helper
- [x] Before update, fetch current period's number range
- [x] After update, if range changed, call sync helper
- [x] All within same transaction

#### 10.2.3 Modify Delete Period
**File**: `server/actions/permit/delete-permit-option-period.ts`

- [x] Before deleting, check for non-available instances
- [x] If any `reserved`, `sold`, or `cancelled` instances exist → throw error
- [x] Delete all `available` instances first
- [x] Then delete period

---

### Phase 10.3: API Endpoints

**Base path**: `server/api/club/[id]/_admin/permits/[permitId]/options/[optionId]/periods/[periodId]/instances/`

- [x] `index.get.ts` - Paginated instances list
- [x] `[instanceId].get.ts` - Single instance details
- [x] `[instanceId].put.ts` - Update instance

---

### Phase 10.4: Client-Side Code

#### 10.4.1 API Client
**File**: `app/actions/permits/api.ts`

- [x] Add interfaces: `GetPermitInstancesCommand`, `UpdatePermitInstanceCommand`
- [x] Add methods to `usePermitClient()`:
  - `getPermitInstancesByPeriodId()`
  - `getPermitInstanceById()`
  - `updatePermitInstance()`

#### 10.4.2 Queries
**File**: `app/actions/permits/queries.ts`

- [x] Add query keys for instances
- [x] Add `usePermitInstancesByPeriodIdQuery`
- [x] Add `usePermitInstanceByIdQuery`

#### 10.4.3 Mutations
**File**: `app/actions/permits/mutations.ts`

- [x] Add `useUpdatePermitInstanceMutation()` with cache invalidation

---

### Phase 10.5: Admin UI Components

#### 10.5.1 Form Composable
**File**: `app/composables/usePermitInstanceForm.ts`

- [x] Follow `useMemberForm` pattern
- [x] Query param `instanceId` for edit state
- [x] Provide `openEdit(id)`, `close()`, `submit()` methods
- [x] Manage form state with reactive object

#### 10.5.2 Form Slideover
**File**: `app/components/PermitInstanceFormSlideover.vue`

- [x] Follow `MemberFormSlideover` pattern
- [x] Fields:
  - Status dropdown (available/reserved/sold/cancelled)
  - Member assignment (dropdown of club members)
  - Owner info: name, email, phone
  - Payment: reference, paidCents
  - Notes textarea
- [x] Use `class="w-full"` on all inputs

#### 10.5.3 Instances Admin Page
**File**: `app/pages/verein/[slug]/_admin/permits/[permitId]/periods/[periodId]/instances.vue`

- [x] Follow `members/index.vue` pattern
- [x] Use `usePagination()` for pagination/search/sorting
- [x] `UTable` with columns:
  - `permitNumber` - sortable
  - `status` - badge with colors (success=available, warning=reserved, info=sold, error=cancelled)
  - `ownerName` - sortable
  - `ownerMember` - linked member name
  - `soldAt` - sortable, formatted date
- [x] Click row to edit via slideover
- [x] Include `PermitInstanceFormSlideover` component

---

### Phase 10.6: Navigation Integration

#### 10.6.1 Link from Period to Instances
**File**: `app/components/permit/PermitPeriodItem.vue`

- [x] Add button/link with ticket icon (Manage cards)
- [x] Navigate to instances page for that period
- [x] Pass optionId via query parameter

---

## Implementation Order

1. **Phase 10.1** - Server actions (helpers first, then CRUD)
2. **Phase 10.2** - Modify existing period actions
3. **Phase 10.3** - API endpoints
4. **Phase 10.4** - Client-side code
5. **Phase 10.5** - UI components
6. **Phase 10.6** - Navigation integration

---

## Critical Files Reference

| Purpose | Path |
|---------|------|
| Permit Instance Schema | `server/database/schema/permit.schema.ts` (lines 64-108) |
| Create Period Action | `server/actions/permit/create-permit-option-period.ts` |
| Update Period Action | `server/actions/permit/update-permit-option-period.ts` |
| Delete Period Action | `server/actions/permit/delete-permit-option-period.ts` |
| Member Form Pattern | `app/composables/useMemberForm.ts` |
| Members List Pattern | `app/pages/verein/[slug]/_admin/members/index.vue` |
| Slideover Pattern | `app/components/MemberFormSlideover.vue` |
| Period Item Component | `app/components/permit/PermitPeriodItem.vue` |

---

## Edge Cases to Handle

- **Large ranges** (1-10000): Consider batch processing in chunks
- **Invalid ranges**: Validate `permitNumberStart <= permitNumberEnd` in schema
- **Concurrent updates**: Transaction wrapper handles this
- **Delete protection**: `onDelete: 'restrict'` on schema prevents orphaned data
