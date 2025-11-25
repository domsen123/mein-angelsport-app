import type { GetPermitByIdCommand } from '~~/server/actions/permit/get-permit-by-id'
import type { GetPermitsByClubIdCommandInput } from '~~/server/actions/permit/get-permits-by-club-id'
import { usePermitClient } from './api'

export const PERMIT_QUERY_KEYS = {
  root: ['permits'] as const,
  getPermitsByClubId: (args: GetPermitsByClubIdCommandInput) => [
    ...PERMIT_QUERY_KEYS.root,
    'by-club-id',
    args.clubId,
    JSON.stringify(args.pagination),
  ] as const,
  getPermitById: (args: GetPermitByIdCommand) => [
    ...PERMIT_QUERY_KEYS.root,
    'by-id',
    args.clubId,
    args.permitId,
  ] as const,
}

export const usePermitsByClubIdQuery = ({ clubId, pagination }: GetPermitsByClubIdCommandInput) =>
  defineQueryOptions({
    key: PERMIT_QUERY_KEYS.getPermitsByClubId({ clubId, pagination }),
    query: () => usePermitClient().getPermitsByClubId({ clubId, pagination }),
    enabled: !!clubId,
    staleTime: 1000 * 60 * 20, // 20 minutes
  })

export const usePermitByIdQuery = ({ clubId, permitId }: GetPermitByIdCommand) =>
  defineQueryOptions({
    key: PERMIT_QUERY_KEYS.getPermitById({ clubId, permitId }),
    query: () => usePermitClient().getPermitById({ clubId, permitId }),
    enabled: !!clubId && !!permitId,
    staleTime: 1000 * 60 * 20, // 20 minutes
  })
