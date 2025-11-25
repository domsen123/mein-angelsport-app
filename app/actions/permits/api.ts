import type { CreatePermitCommand } from '~~/server/actions/permit/create-permit'
import type { GetPermitByIdCommand } from '~~/server/actions/permit/get-permit-by-id'
import type { GetPermitsByClubIdCommandInput } from '~~/server/actions/permit/get-permits-by-club-id'

export interface UpdatePermitCommand {
  clubId: string
  permitId: string
  name: string
}

export interface CreatePermitOptionCommand {
  clubId: string
  permitId: string
  name?: string
  description?: string
}

export interface UpdatePermitOptionCommand {
  clubId: string
  permitId: string
  optionId: string
  name?: string
  description?: string
}

export interface DeletePermitOptionCommand {
  clubId: string
  permitId: string
  optionId: string
}

export interface CreatePermitOptionPeriodCommand {
  clubId: string
  permitId: string
  optionId: string
  validFrom: string
  validTo: string
  priceCents: string
  permitNumberStart: number
  permitNumberEnd: number
}

export interface UpdatePermitOptionPeriodCommand {
  clubId: string
  permitId: string
  optionId: string
  periodId: string
  validFrom?: string
  validTo?: string
  priceCents?: string
  permitNumberStart?: number
  permitNumberEnd?: number
}

export interface DeletePermitOptionPeriodCommand {
  clubId: string
  permitId: string
  optionId: string
  periodId: string
}

export interface AssignWaterToPermitCommand {
  clubId: string
  permitId: string
  waterId: string
}

export interface RemoveWaterFromPermitCommand {
  clubId: string
  permitId: string
  waterId: string
}

// Permit Instance interfaces
export interface GetPermitInstancesByPeriodIdCommand {
  clubId: string
  permitId: string
  optionId: string
  periodId: string
  pagination: {
    page: number
    pageSize: number
    searchTerm?: string
    orderBy?: string[]
  }
}

export interface GetPermitInstanceByIdCommand {
  clubId: string
  permitId: string
  optionId: string
  periodId: string
  instanceId: string
}

export interface UpdatePermitInstanceCommand {
  clubId: string
  permitId: string
  optionId: string
  periodId: string
  instanceId: string
  status?: 'available' | 'reserved' | 'sold' | 'cancelled'
  ownerMemberId?: string | null
  ownerName?: string | null
  ownerEmail?: string | null
  ownerPhone?: string | null
  paymentReference?: string | null
  paidCents?: string | null
  notes?: string | null
}

export const usePermitClient = () => {
  const { $api } = useNuxtApp()

  // Permit CRUD
  const getPermitsByClubId = ({ clubId, pagination }: GetPermitsByClubIdCommandInput) =>
    $api(`/api/club/${clubId}/_admin/permits`, {
      method: 'GET',
      query: { ...pagination },
    })

  const getPermitById = ({ clubId, permitId }: GetPermitByIdCommand) =>
    $api(`/api/club/${clubId}/_admin/permits/${permitId}`, {
      method: 'GET',
    })

  const createPermit = ({ clubId, ...body }: CreatePermitCommand) =>
    $api(`/api/club/${clubId}/_admin/permits`, {
      method: 'POST',
      body,
    })

  const updatePermit = ({ clubId, permitId, ...body }: UpdatePermitCommand) =>
    $api(`/api/club/${clubId}/_admin/permits/${permitId}`, {
      method: 'PUT',
      body,
    })

  const deletePermit = ({ clubId, permitId }: { clubId: string, permitId: string }) =>
    $api(`/api/club/${clubId}/_admin/permits/${permitId}`, {
      method: 'DELETE',
    })

  // Option CRUD
  const createPermitOption = ({ clubId, permitId, ...body }: CreatePermitOptionCommand) =>
    $api(`/api/club/${clubId}/_admin/permits/${permitId}/options`, {
      method: 'POST',
      body,
    })

  const updatePermitOption = ({ clubId, permitId, optionId, ...body }: UpdatePermitOptionCommand) =>
    $api(`/api/club/${clubId}/_admin/permits/${permitId}/options/${optionId}`, {
      method: 'PUT',
      body,
    })

  const deletePermitOption = ({ clubId, permitId, optionId }: DeletePermitOptionCommand) =>
    $api(`/api/club/${clubId}/_admin/permits/${permitId}/options/${optionId}`, {
      method: 'DELETE',
    })

  // Period CRUD
  const createPermitOptionPeriod = ({ clubId, permitId, optionId, ...body }: CreatePermitOptionPeriodCommand) =>
    $api(`/api/club/${clubId}/_admin/permits/${permitId}/options/${optionId}/periods`, {
      method: 'POST',
      body,
    })

  const updatePermitOptionPeriod = ({ clubId, permitId, optionId, periodId, ...body }: UpdatePermitOptionPeriodCommand) =>
    $api(`/api/club/${clubId}/_admin/permits/${permitId}/options/${optionId}/periods/${periodId}`, {
      method: 'PUT',
      body,
    })

  const deletePermitOptionPeriod = ({ clubId, permitId, optionId, periodId }: DeletePermitOptionPeriodCommand) =>
    $api(`/api/club/${clubId}/_admin/permits/${permitId}/options/${optionId}/periods/${periodId}`, {
      method: 'DELETE',
    })

  // Water assignment
  const assignWaterToPermit = ({ clubId, permitId, waterId }: AssignWaterToPermitCommand) =>
    $api(`/api/club/${clubId}/_admin/permits/${permitId}/waters`, {
      method: 'POST',
      body: { waterId },
    })

  const removeWaterFromPermit = ({ clubId, permitId, waterId }: RemoveWaterFromPermitCommand) =>
    $api(`/api/club/${clubId}/_admin/permits/${permitId}/waters/${waterId}`, {
      method: 'DELETE',
    })

  // Instance CRUD
  const getPermitInstancesByPeriodId = ({ clubId, permitId, optionId, periodId, pagination }: GetPermitInstancesByPeriodIdCommand) =>
    $api(`/api/club/${clubId}/_admin/permits/${permitId}/options/${optionId}/periods/${periodId}/instances`, {
      method: 'GET',
      query: { ...pagination },
    })

  const getPermitInstanceById = ({ clubId, permitId, optionId, periodId, instanceId }: GetPermitInstanceByIdCommand) =>
    $api(`/api/club/${clubId}/_admin/permits/${permitId}/options/${optionId}/periods/${periodId}/instances/${instanceId}`, {
      method: 'GET',
    })

  const updatePermitInstance = ({ clubId, permitId, optionId, periodId, instanceId, ...body }: UpdatePermitInstanceCommand) =>
    $api(`/api/club/${clubId}/_admin/permits/${permitId}/options/${optionId}/periods/${periodId}/instances/${instanceId}`, {
      method: 'PUT',
      body,
    })

  return {
    getPermitsByClubId,
    getPermitById,
    createPermit,
    updatePermit,
    deletePermit,
    createPermitOption,
    updatePermitOption,
    deletePermitOption,
    createPermitOptionPeriod,
    updatePermitOptionPeriod,
    deletePermitOptionPeriod,
    assignWaterToPermit,
    removeWaterFromPermit,
    getPermitInstancesByPeriodId,
    getPermitInstanceById,
    updatePermitInstance,
  }
}
