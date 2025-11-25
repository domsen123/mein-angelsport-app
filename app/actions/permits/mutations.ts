import type { CreatePermitCommand } from '~~/server/actions/permit/create-permit'
import type {
  AssignWaterToPermitCommand,
  CreatePermitOptionCommand,
  CreatePermitOptionPeriodCommand,
  DeletePermitOptionCommand,
  DeletePermitOptionPeriodCommand,
  RemoveWaterFromPermitCommand,
  UpdatePermitCommand,
  UpdatePermitOptionCommand,
  UpdatePermitOptionPeriodCommand,
} from './api'
import { usePermitClient } from './api'
import { PERMIT_QUERY_KEYS } from './queries'

// Permit mutations
export function useCreatePermitMutation() {
  const queryCache = useQueryCache()
  const client = usePermitClient()

  return useMutation({
    mutation: (input: CreatePermitCommand) => client.createPermit(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: [...PERMIT_QUERY_KEYS.root, 'by-club-id', variables.clubId] })
    },
  })
}

export function useUpdatePermitMutation() {
  const queryCache = useQueryCache()
  const client = usePermitClient()

  return useMutation({
    mutation: (input: UpdatePermitCommand) => client.updatePermit(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: [...PERMIT_QUERY_KEYS.root, 'by-club-id', variables.clubId] })
      queryCache.invalidateQueries({ key: PERMIT_QUERY_KEYS.getPermitById({ clubId: variables.clubId, permitId: variables.permitId }) })
    },
  })
}

export function useDeletePermitMutation() {
  const queryCache = useQueryCache()
  const client = usePermitClient()

  return useMutation({
    mutation: (input: { clubId: string, permitId: string }) => client.deletePermit(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: [...PERMIT_QUERY_KEYS.root, 'by-club-id', variables.clubId] })
    },
  })
}

// Option mutations
export function useCreatePermitOptionMutation() {
  const queryCache = useQueryCache()
  const client = usePermitClient()

  return useMutation({
    mutation: (input: CreatePermitOptionCommand) => client.createPermitOption(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: PERMIT_QUERY_KEYS.getPermitById({ clubId: variables.clubId, permitId: variables.permitId }) })
    },
  })
}

export function useUpdatePermitOptionMutation() {
  const queryCache = useQueryCache()
  const client = usePermitClient()

  return useMutation({
    mutation: (input: UpdatePermitOptionCommand) => client.updatePermitOption(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: PERMIT_QUERY_KEYS.getPermitById({ clubId: variables.clubId, permitId: variables.permitId }) })
    },
  })
}

export function useDeletePermitOptionMutation() {
  const queryCache = useQueryCache()
  const client = usePermitClient()

  return useMutation({
    mutation: (input: DeletePermitOptionCommand) => client.deletePermitOption(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: PERMIT_QUERY_KEYS.getPermitById({ clubId: variables.clubId, permitId: variables.permitId }) })
    },
  })
}

// Period mutations
export function useCreatePermitOptionPeriodMutation() {
  const queryCache = useQueryCache()
  const client = usePermitClient()

  return useMutation({
    mutation: (input: CreatePermitOptionPeriodCommand) => client.createPermitOptionPeriod(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: PERMIT_QUERY_KEYS.getPermitById({ clubId: variables.clubId, permitId: variables.permitId }) })
    },
  })
}

export function useUpdatePermitOptionPeriodMutation() {
  const queryCache = useQueryCache()
  const client = usePermitClient()

  return useMutation({
    mutation: (input: UpdatePermitOptionPeriodCommand) => client.updatePermitOptionPeriod(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: PERMIT_QUERY_KEYS.getPermitById({ clubId: variables.clubId, permitId: variables.permitId }) })
    },
  })
}

export function useDeletePermitOptionPeriodMutation() {
  const queryCache = useQueryCache()
  const client = usePermitClient()

  return useMutation({
    mutation: (input: DeletePermitOptionPeriodCommand) => client.deletePermitOptionPeriod(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: PERMIT_QUERY_KEYS.getPermitById({ clubId: variables.clubId, permitId: variables.permitId }) })
    },
  })
}

// Water mutations
export function useAssignWaterToPermitMutation() {
  const queryCache = useQueryCache()
  const client = usePermitClient()

  return useMutation({
    mutation: (input: AssignWaterToPermitCommand) => client.assignWaterToPermit(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: PERMIT_QUERY_KEYS.getPermitById({ clubId: variables.clubId, permitId: variables.permitId }) })
    },
  })
}

export function useRemoveWaterFromPermitMutation() {
  const queryCache = useQueryCache()
  const client = usePermitClient()

  return useMutation({
    mutation: (input: RemoveWaterFromPermitCommand) => client.removeWaterFromPermit(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: PERMIT_QUERY_KEYS.getPermitById({ clubId: variables.clubId, permitId: variables.permitId }) })
    },
  })
}
