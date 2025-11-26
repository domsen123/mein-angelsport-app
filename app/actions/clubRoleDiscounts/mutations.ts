import type { CreateDiscountCommand } from '~~/server/actions/clubRolePermitDiscount/create-discount'
import type { DeleteDiscountCommand } from '~~/server/actions/clubRolePermitDiscount/delete-discount'
import type { UpdateDiscountCommand } from '~~/server/actions/clubRolePermitDiscount/update-discount'
import { useClubRoleDiscountClient } from './api'
import { CLUB_ROLE_DISCOUNT_QUERY_KEYS } from './queries'

export function useCreateDiscountMutation() {
  const queryCache = useQueryCache()
  const client = useClubRoleDiscountClient()

  return useMutation({
    mutation: (input: CreateDiscountCommand) => client.createDiscount(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({
        key: CLUB_ROLE_DISCOUNT_QUERY_KEYS.getDiscountsByRoleId({
          clubId: variables.clubId,
          roleId: variables.clubRoleId,
        }),
      })
    },
  })
}

export function useUpdateDiscountMutation() {
  const queryCache = useQueryCache()
  const client = useClubRoleDiscountClient()

  return useMutation({
    mutation: (input: UpdateDiscountCommand & { roleId: string }) => client.updateDiscount(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({
        key: CLUB_ROLE_DISCOUNT_QUERY_KEYS.getDiscountsByRoleId({
          clubId: variables.clubId,
          roleId: variables.roleId,
        }),
      })
    },
  })
}

export function useDeleteDiscountMutation() {
  const queryCache = useQueryCache()
  const client = useClubRoleDiscountClient()

  return useMutation({
    mutation: (input: DeleteDiscountCommand & { roleId: string }) => client.deleteDiscount(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({
        key: CLUB_ROLE_DISCOUNT_QUERY_KEYS.getDiscountsByRoleId({
          clubId: variables.clubId,
          roleId: variables.roleId,
        }),
      })
    },
  })
}
