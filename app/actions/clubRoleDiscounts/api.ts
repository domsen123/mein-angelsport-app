import type { CreateDiscountCommand } from '~~/server/actions/clubRolePermitDiscount/create-discount'
import type { DeleteDiscountCommand } from '~~/server/actions/clubRolePermitDiscount/delete-discount'
import type {
  DiscountItem,
  GetDiscountsByRoleIdQuery,
  GetDiscountsByRoleIdResponse,
} from '~~/server/actions/clubRolePermitDiscount/get-discounts-by-role-id'
import type { UpdateDiscountCommand } from '~~/server/actions/clubRolePermitDiscount/update-discount'

export type { DiscountItem, GetDiscountsByRoleIdResponse }

export const useClubRoleDiscountClient = () => {
  const { $api } = useNuxtApp()

  const getDiscountsByRoleId = ({ clubId, roleId }: GetDiscountsByRoleIdQuery) =>
    $api<GetDiscountsByRoleIdResponse>(`/api/club/${clubId}/_admin/roles/${roleId}/discounts`, {
      method: 'GET',
    })

  const createDiscount = (input: CreateDiscountCommand) =>
    $api(`/api/club/${input.clubId}/_admin/roles/${input.clubRoleId}/discounts`, {
      method: 'POST',
      body: {
        permitOptionId: input.permitOptionId,
        discountPercent: input.discountPercent,
      },
    })

  const updateDiscount = (input: UpdateDiscountCommand & { roleId: string }) =>
    $api(`/api/club/${input.clubId}/_admin/roles/${input.roleId}/discounts/${input.discountId}`, {
      method: 'PUT',
      body: {
        discountPercent: input.discountPercent,
      },
    })

  const deleteDiscount = (input: DeleteDiscountCommand & { roleId: string }) =>
    $api(`/api/club/${input.clubId}/_admin/roles/${input.roleId}/discounts/${input.discountId}`, {
      method: 'DELETE',
    })

  return {
    getDiscountsByRoleId,
    createDiscount,
    updateDiscount,
    deleteDiscount,
  }
}
