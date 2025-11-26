import { useShopClient } from './api'

export const SHOP_QUERY_KEYS = {
  root: ['shop'] as const,
  selectableMembers: (clubId: string) => [
    ...SHOP_QUERY_KEYS.root,
    'selectable-members',
    clubId,
  ] as const,
  memberOrders: (clubId: string, memberId: string) => [
    ...SHOP_QUERY_KEYS.root,
    'member-orders',
    clubId,
    memberId,
  ] as const,
  availablePermits: (clubId: string) => [
    ...SHOP_QUERY_KEYS.root,
    'available-permits',
    clubId,
  ] as const,
  workDutyStatus: (clubId: string, memberId: string) => [
    ...SHOP_QUERY_KEYS.root,
    'work-duty-status',
    clubId,
    memberId,
  ] as const,
  memberDiscounts: (clubId: string, memberId: string) => [
    ...SHOP_QUERY_KEYS.root,
    'member-discounts',
    clubId,
    memberId,
  ] as const,
}

export interface SelectableMembersQueryInput {
  clubId: string
}

export interface WorkDutyStatusQueryInput {
  clubId: string
  memberId: string
}

export interface MemberDiscountsQueryInput {
  clubId: string
  memberId: string
}

export interface MemberOrdersQueryInput {
  clubId: string
  memberId: string
}

export const useSelectableMembersQuery = defineQueryOptions(
  ({ clubId }: SelectableMembersQueryInput) => ({
    key: SHOP_QUERY_KEYS.selectableMembers(clubId),
    query: () => useShopClient().getSelectableMembers(clubId),
    enabled: !!clubId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  }),
)

export const useAvailablePermitsQuery = defineQueryOptions(
  ({ clubId }: SelectableMembersQueryInput) => ({
    key: SHOP_QUERY_KEYS.availablePermits(clubId),
    query: () => useShopClient().getAvailablePermits(clubId),
    enabled: !!clubId,
    staleTime: 1000 * 60 * 1, // 1 minute (availability can change)
  }),
)

export const useWorkDutyStatusQuery = defineQueryOptions(
  ({ clubId, memberId }: WorkDutyStatusQueryInput) => ({
    key: SHOP_QUERY_KEYS.workDutyStatus(clubId, memberId),
    query: () => useShopClient().getWorkDutyStatus(clubId, memberId),
    enabled: !!clubId && !!memberId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  }),
)

export const useMemberDiscountsQuery = defineQueryOptions(
  ({ clubId, memberId }: MemberDiscountsQueryInput) => ({
    key: SHOP_QUERY_KEYS.memberDiscounts(clubId, memberId),
    query: () => useShopClient().getMemberDiscounts(clubId, memberId),
    enabled: !!clubId && !!memberId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  }),
)

export const useMemberOrdersQuery = defineQueryOptions(
  ({ clubId, memberId }: MemberOrdersQueryInput) => ({
    key: SHOP_QUERY_KEYS.memberOrders(clubId, memberId),
    query: () => useShopClient().getMemberOrders(clubId, memberId),
    enabled: !!clubId && !!memberId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  }),
)
