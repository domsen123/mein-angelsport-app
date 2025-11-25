# Permit Admin Page Implementation

## Overview
Implement a permit management admin page with:
- **List Page**: Paginated table of permits with search and sorting
- **Form Page**: Separate page (not slideover) for create/edit with inline editing for options and periods
- **Incremental Save**: Create permit first, then add options/periods/waters individually

---

## Phase 1: Server-Side Query Actions

### 1.1 Get Permits List
> Create paginated query for permits by club ID

- [ ] Create `server/actions/permit/get-permits-by-club-id.ts`
  - [ ] Define `GetPermitsByClubIdCommandSchema` with `clubId` and `pagination`
  - [ ] Use `paginateQuery` helper from `server/database/pagination.ts`
  - [ ] Include counts for waters and options using subqueries or aggregation
  - [ ] Add `isExecutorClubAdmin` authorization check
  - [ ] Export response types for frontend usage
  - [ ] Searchable columns: `permit.name`
  - [ ] Sortable columns: `name`, `createdAt`

### 1.2 Get Single Permit
> Fetch permit with all nested relations for edit form

- [ ] Create `server/actions/permit/get-permit-by-id.ts`
  - [ ] Define `GetPermitByIdCommandSchema` with `clubId` and `permitId`
  - [ ] Query permit with relations:
    - [ ] `waters` (via `permitWater` join table)
    - [ ] `options` (from `permitOption`)
    - [ ] `periods` within each option (from `permitOptionPeriod`)
  - [ ] Add `isExecutorClubAdmin` authorization check
  - [ ] Export response types

### 1.3 Get Club Waters
> Fetch waters associated with a club for selection dropdown

- [ ] Create `server/actions/water/get-waters-by-club-id.ts`
  - [ ] Define schema with `clubId`
  - [ ] Query `club_water` joined with `water` table
  - [ ] Return `{ id, name, type }` for each water
  - [ ] Add authorization check

---

## Phase 2: Server-Side API Endpoints (Read)

### 2.1 List Permits Endpoint
- [ ] Create `server/api/club/[id]/_admin/permits/index.get.ts`
  - [ ] Parse pagination from query params
  - [ ] Call `getPermitsByClubId` action
  - [ ] Return paginated result

### 2.2 Single Permit Endpoint
- [ ] Create `server/api/club/[id]/_admin/permits/[permitId].get.ts`
  - [ ] Parse `permitId` from route params
  - [ ] Call `getPermitById` action
  - [ ] Return permit with nested data

### 2.3 Club Waters Endpoint
- [ ] Create `server/api/club/[id]/_admin/waters/index.get.ts`
  - [ ] Call `getWatersByClubId` action
  - [ ] Return list of waters

---

## Phase 3: Client-Side API Layer

### 3.1 API Client
- [ ] Create `app/actions/permits/api.ts`
  - [ ] `getPermitsByClubId({ clubId, pagination })`
  - [ ] `getPermitById({ clubId, permitId })`
  - [ ] `createPermit({ clubId, name })`
  - [ ] `updatePermit({ clubId, permitId, name })`
  - [ ] `deletePermit({ clubId, permitId })`
  - [ ] `createPermitOption({ clubId, permitId, name?, description? })`
  - [ ] `updatePermitOption({ clubId, permitId, optionId, name?, description? })`
  - [ ] `deletePermitOption({ clubId, permitId, optionId })`
  - [ ] `createPermitOptionPeriod({ clubId, permitId, optionId, ...periodData })`
  - [ ] `updatePermitOptionPeriod({ clubId, permitId, optionId, periodId, ...periodData })`
  - [ ] `deletePermitOptionPeriod({ clubId, permitId, optionId, periodId })`
  - [ ] `assignWaterToPermit({ clubId, permitId, waterId })`
  - [ ] `removeWaterFromPermit({ clubId, permitId, waterId })`

### 3.2 Query Definitions
- [ ] Create `app/actions/permits/queries.ts`
  - [ ] Define `PERMIT_QUERY_KEYS` object
  - [ ] `usePermitsByClubIdQuery` - list with pagination
  - [ ] `usePermitByIdQuery` - single permit with relations

### 3.3 Waters Query
- [ ] Create `app/actions/waters/queries.ts` (if not exists)
  - [ ] `useWatersByClubIdQuery` - for dropdown selection

---

## Phase 4: List Page Implementation

### 4.1 Permits List Page
- [ ] Implement `app/pages/verein/[slug]/_admin/permits/index.vue`
  - [ ] Import `usePagination` composable
  - [ ] Set up columns with `TableColumn<PermitItem>[]`:
    - [ ] `name` - sortable
    - [ ] `watersCount` - number of waters
    - [ ] `optionsCount` - number of options
    - [ ] `createdAt` - sortable, formatted date
    - [ ] `actions` - edit button
  - [ ] Add search input with `v-model="searchTerm"`
  - [ ] Add "Neuer Erlaubnisschein" button → navigates to `/permits/new`
  - [ ] Add `UTable` with sorting and row click handler
  - [ ] Add `UPagination` component
  - [ ] Row click navigates to `/permits/{id}`

### 4.2 Add to useClub Composable
- [ ] Update `app/composables/useClub.ts`
  - [ ] Add `getPermits(pagination)` method
  - [ ] Return query for permits list

---

## Phase 5: Server-Side Mutation Actions

### 5.1 Update Permit
- [ ] Create `server/actions/permit/update-permit.ts`
  - [ ] Schema: `{ clubId, permitId, name }`
  - [ ] Update permit record
  - [ ] Add authorization check

### 5.2 Delete Permit
- [ ] Create `server/actions/permit/delete-permit.ts`
  - [ ] Schema: `{ clubId, permitId }`
  - [ ] Delete permit (cascades to options/periods via FK)
  - [ ] Add authorization check

### 5.3 Update Permit Option
- [ ] Create `server/actions/permit/update-permit-option.ts`
  - [ ] Schema: `{ permitOptionId, name?, description? }`
  - [ ] Update option record
  - [ ] Add authorization check (via permit → club)

### 5.4 Delete Permit Option
- [ ] Create `server/actions/permit/delete-permit-option.ts`
  - [ ] Schema: `{ permitOptionId }`
  - [ ] Delete option (cascades to periods)
  - [ ] Add authorization check

### 5.5 Update Permit Option Period
- [ ] Create `server/actions/permit/update-permit-option-period.ts`
  - [ ] Schema: `{ permitOptionPeriodId, validFrom, validTo, priceCents, permitNumberStart, permitNumberEnd }`
  - [ ] Update period record
  - [ ] Add authorization check

### 5.6 Delete Permit Option Period
- [ ] Create `server/actions/permit/delete-permit-option-period.ts`
  - [ ] Schema: `{ permitOptionPeriodId }`
  - [ ] Delete period
  - [ ] Add authorization check

### 5.7 Remove Water from Permit
- [ ] Create `server/actions/permitWater/remove-permit-from-water.ts`
  - [ ] Schema: `{ permitId, waterId }`
  - [ ] Delete from `permitWater` join table
  - [ ] Add authorization check

---

## Phase 6: Server-Side API Endpoints (Mutations)

### 6.1 Permit CRUD Endpoints
- [ ] Create `server/api/club/[id]/_admin/permits/index.post.ts` (create)
- [ ] Create `server/api/club/[id]/_admin/permits/[permitId].put.ts` (update)
- [ ] Create `server/api/club/[id]/_admin/permits/[permitId].delete.ts` (delete)

### 6.2 Option CRUD Endpoints
- [ ] Create `server/api/club/[id]/_admin/permits/[permitId]/options/index.post.ts`
- [ ] Create `server/api/club/[id]/_admin/permits/[permitId]/options/[optionId].put.ts`
- [ ] Create `server/api/club/[id]/_admin/permits/[permitId]/options/[optionId].delete.ts`

### 6.3 Period CRUD Endpoints
- [ ] Create `server/api/club/[id]/_admin/permits/[permitId]/options/[optionId]/periods/index.post.ts`
- [ ] Create `server/api/club/[id]/_admin/permits/[permitId]/options/[optionId]/periods/[periodId].put.ts`
- [ ] Create `server/api/club/[id]/_admin/permits/[permitId]/options/[optionId]/periods/[periodId].delete.ts`

### 6.4 Water Assignment Endpoints
- [ ] Create `server/api/club/[id]/_admin/permits/[permitId]/waters/index.post.ts` (assign)
- [ ] Create `server/api/club/[id]/_admin/permits/[permitId]/waters/[waterId].delete.ts` (remove)

---

## Phase 7: Client-Side Mutations

### 7.1 Permit Mutations
- [ ] Create `app/actions/permits/mutations.ts`
  - [ ] `useCreatePermitMutation` - invalidates list query
  - [ ] `useUpdatePermitMutation` - invalidates list and single queries
  - [ ] `useDeletePermitMutation` - invalidates list query

### 7.2 Option Mutations
- [ ] Add to `app/actions/permits/mutations.ts`
  - [ ] `useCreatePermitOptionMutation`
  - [ ] `useUpdatePermitOptionMutation`
  - [ ] `useDeletePermitOptionMutation`

### 7.3 Period Mutations
- [ ] Add to `app/actions/permits/mutations.ts`
  - [ ] `useCreatePermitOptionPeriodMutation`
  - [ ] `useUpdatePermitOptionPeriodMutation`
  - [ ] `useDeletePermitOptionPeriodMutation`

### 7.4 Water Mutations
- [ ] Add to `app/actions/permits/mutations.ts`
  - [ ] `useAssignWaterToPermitMutation`
  - [ ] `useRemoveWaterFromPermitMutation`

---

## Phase 8: Form Page Implementation

### 8.1 Form Page Structure
- [ ] Create `app/pages/verein/[slug]/_admin/permits/[permitId].vue`
  - [ ] Detect mode: `permitId === 'new'` → create, else edit
  - [ ] Fetch permit data in edit mode using `usePermitByIdQuery`
  - [ ] Fetch club waters using `useWatersByClubIdQuery`
  - [ ] Page layout with sections:
    - [ ] Header with title and back button
    - [ ] General section (name input)
    - [ ] Waters section (multi-select)
    - [ ] Options section (list with add button)

### 8.2 General Section
- [ ] Name input field (`UInput`)
- [ ] Save button (create mode) → creates permit, redirects to edit page
- [ ] Auto-save on blur (edit mode) or explicit save button

### 8.3 Waters Section
- [ ] Multi-select dropdown (`USelectMenu` with `multiple`)
- [ ] Show currently assigned waters as badges
- [ ] On selection change: call assign/remove mutations immediately

### 8.4 Options Section Component
- [ ] Create `app/components/permit/PermitOptionsSection.vue`
  - [ ] List of options with expandable rows
  - [ ] "Option hinzufügen" button at bottom
  - [ ] Each option shows name, description, period count
  - [ ] Click to expand and show periods

### 8.5 Option Item Component
- [ ] Create `app/components/permit/PermitOptionItem.vue`
  - [ ] Expandable card/row for single option
  - [ ] Inline editable fields: name, description
  - [ ] Delete button with confirmation
  - [ ] Contains periods list when expanded
  - [ ] "Zeitraum hinzufügen" button

### 8.6 Period Item Component
- [ ] Create `app/components/permit/PermitPeriodItem.vue`
  - [ ] Row within option showing period details
  - [ ] Inline editable fields:
    - [ ] `validFrom` - date picker
    - [ ] `validTo` - date picker
    - [ ] `priceCents` - currency input (display as €, store as cents string)
    - [ ] `permitNumberStart` - number input
    - [ ] `permitNumberEnd` - number input
  - [ ] Delete button with confirmation
  - [ ] Save button or auto-save on field blur

---

## Phase 9: Polish & Testing

### 9.1 Form Validation
- [ ] Add Zod validation schemas for all forms
- [ ] Display validation errors inline
- [ ] Validate date ranges (validFrom < validTo)
- [ ] Validate permit number ranges (start < end)

### 9.2 Loading & Error States
- [ ] Show loading spinners during mutations
- [ ] Toast notifications for success/error
- [ ] Disable buttons during loading
- [ ] Handle network errors gracefully

### 9.3 Delete Confirmations
- [ ] Confirmation dialog before deleting permit
- [ ] Confirmation before deleting option (warns about periods)
- [ ] Confirmation before deleting period

### 9.4 Navigation
- [ ] Back button on form page returns to list
- [ ] After creating permit, redirect to edit page with new ID
- [ ] After deleting permit, redirect to list

---

## Reference Files

| Purpose | Path |
|---------|------|
| Pagination helper | `server/database/pagination.ts` |
| Server action pattern | `server/actions/clubMember/get-club-members-by-club-id.ts` |
| Existing create actions | `server/actions/permit/create-permit.ts` |
| API client pattern | `app/actions/clubMembers/api.ts` |
| Query pattern | `app/actions/clubMembers/queries.ts` |
| Mutation pattern | `app/actions/clubMembers/mutations.ts` |
| Form composable | `app/composables/useMemberForm.ts` |
| List page pattern | `app/pages/verein/[slug]/_admin/members/index.vue` |
| Permit schema | `server/database/schema/permit.schema.ts` |
| Water schema | `server/database/schema/water.schema.ts` |

---

## Data Model Reminder

```
permit (name, clubId)
  └── permitOption (name, description)
        └── permitOptionPeriod (validFrom, validTo, priceCents, permitNumberStart, permitNumberEnd)

permitWater (permitId, waterId) - join table
```

**Incremental Save Flow:**
1. Create permit (name only) → get ID → redirect to edit
2. On edit page: add options, periods, waters - each saves immediately
3. No draft state - all changes persist immediately
