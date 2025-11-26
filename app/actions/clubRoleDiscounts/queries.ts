import type { GetDiscountsByRoleIdQuery } from '~~/server/actions/clubRolePermitDiscount/get-discounts-by-role-id'
import { useClubRoleDiscountClient } from './api'

export const CLUB_ROLE_DISCOUNT_QUERY_KEYS = {
  root: ['club-role-discounts'] as const,
  getDiscountsByRoleId: (args: GetDiscountsByRoleIdQuery) => [
    ...CLUB_ROLE_DISCOUNT_QUERY_KEYS.root,
    'by-role-id',
    args.clubId,
    args.roleId,
  ] as const,
}

export const useDiscountsByRoleIdQuery = ({ clubId, roleId }: GetDiscountsByRoleIdQuery) => defineQueryOptions({
  key: CLUB_ROLE_DISCOUNT_QUERY_KEYS.getDiscountsByRoleId({ clubId, roleId }),
  query: () => useClubRoleDiscountClient().getDiscountsByRoleId({ clubId, roleId }),
  enabled: !!clubId && !!roleId && roleId !== 'new',
  staleTime: 1000 * 60 * 5, // 5 minutes
})
