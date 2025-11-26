<script lang="ts" setup>
import type { AvailablePermit, AvailablePermitOption, AvailablePermitPeriod } from '~~/server/actions/shop/get-available-permits'
import { useReservePermitsMutation } from '~/actions/shop/mutations'
import { useAvailablePermitsQuery, useMemberOrdersQuery, useSelectableMembersQuery } from '~/actions/shop/queries'

const { club, clubSlug } = useClub()
const router = useRouter()
const toast = useToast()
const checkoutStore = useShopCheckoutStore()

const clubId = computed(() => club.value?.id)

// Queries
const { data: membersData, isLoading: membersLoading } = useQuery(
  useSelectableMembersQuery,
  () => ({ clubId: clubId.value! }),
)
const { data: permitsData, isLoading: permitsLoading } = useQuery(
  useAvailablePermitsQuery,
  () => ({ clubId: clubId.value! }),
)

// Selected member
const selectedMemberId = ref<string | undefined>(checkoutStore.state.memberId ?? undefined)

// Query member's existing orders when member is selected
const { data: memberOrdersData, isLoading: memberOrdersLoading } = useQuery(
  useMemberOrdersQuery,
  () => ({
    clubId: clubId.value!,
    memberId: selectedMemberId.value!,
  }),
)

// Set of owned permit period IDs for duplicate checking
const ownedPermitPeriodIds = computed(() =>
  new Set(memberOrdersData.value?.ownedPermitPeriodIds ?? []),
)

// Check if a period is already owned by the selected member
const isPeriodOwned = (periodId: string) =>
  ownedPermitPeriodIds.value.has(periodId)

// Track selected options per permit (permitId -> periodId)
const selectedOptions = ref<Record<string, string>>({})

// Initialize from checkout store if returning
onMounted(() => {
  if (checkoutStore.state.selectedPermits.length > 0) {
    for (const permit of checkoutStore.state.selectedPermits) {
      selectedOptions.value[permit.permitId] = permit.periodId
    }
  }
})

// Selected member display name
const _selectedMember = computed(() => {
  if (!selectedMemberId.value || !membersData.value)
    return null
  return membersData.value.members.find((m: { id: string }) => m.id === selectedMemberId.value)
})

// Check if any permits are selected
const hasSelectedPermits = computed(() => Object.keys(selectedOptions.value).length > 0)

// Mutation
const reserveMutation = useReservePermitsMutation()

const formatPrice = (cents: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING': return 'Ausstehend'
    case 'PAID': return 'Bezahlt'
    case 'FULFILLED': return 'Abgeschlossen'
    case 'CANCELLED': return 'Storniert'
    default: return status
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING': return 'warning'
    case 'PAID': return 'info'
    case 'FULFILLED': return 'success'
    case 'CANCELLED': return 'error'
    default: return 'neutral'
  }
}

const toggleOption = (permitId: string, periodId: string) => {
  if (selectedOptions.value[permitId] === periodId) {
    delete selectedOptions.value[permitId]
  }
  else {
    selectedOptions.value[permitId] = periodId
  }
}

const isOptionSelected = (permitId: string, periodId: string) =>
  selectedOptions.value[permitId] === periodId

const _getSelectedPeriod = (permit: AvailablePermit, option: AvailablePermitOption): AvailablePermitPeriod | undefined => {
  const periodId = selectedOptions.value[permit.id]
  if (!periodId)
    return undefined
  return option.periods.find(p => p.id === periodId)
}

const handleContinue = async () => {
  if (!selectedMemberId.value || !clubId.value) {
    toast.add({
      title: 'Fehler',
      description: 'Bitte wählen Sie ein Mitglied aus.',
      color: 'error',
    })
    return
  }

  if (!hasSelectedPermits.value) {
    toast.add({
      title: 'Fehler',
      description: 'Bitte wählen Sie mindestens einen Erlaubnisschein aus.',
      color: 'error',
    })
    return
  }

  // Build permits array for reservation
  const permitsToReserve = Object.entries(selectedOptions.value).map(([_permitId, periodId]) => ({
    optionPeriodId: periodId,
  }))

  try {
    const result = await reserveMutation.mutateAsync({
      clubId: clubId.value,
      memberId: selectedMemberId.value,
      permits: permitsToReserve,
    })

    // Update checkout store with reservation info
    const member = membersData.value?.members.find((m: { id: string }) => m.id === selectedMemberId.value)
    checkoutStore.setMember(
      selectedMemberId.value,
      member ? `${member.firstName} ${member.lastName}` : '',
    )

    checkoutStore.setSelectedPermits(
      result.reservedInstances.map(instance => ({
        permitId: instance.permitId,
        permitName: instance.permitName,
        optionId: instance.optionId,
        optionName: instance.optionName,
        periodId: instance.periodId,
        permitInstanceId: instance.permitInstanceId,
        priceCents: instance.priceCents,
      })),
    )

    checkoutStore.setReservationExpiresAt(new Date(result.expiresAt))

    // Navigate to step 2
    router.push(`/verein/${clubSlug.value}/shop/work-duties`)
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.'
    toast.add({
      title: 'Reservierung fehlgeschlagen',
      description: message,
      color: 'error',
    })
  }
}
</script>

<template>
  <UPageBody>
    <div class="space-y-6">
      <!-- Sale Period Warning -->
      <UAlert
        v-if="permitsData && !permitsData.isSaleActive"
        color="warning"
        icon="i-lucide-alert-triangle"
        title="Verkaufsperiode nicht aktiv"
        :description="`Der Erlaubnisscheinverkauf ist vom ${permitsData.saleStart} bis ${permitsData.saleEnd} möglich.`"
      />

      <!-- Loading -->
      <div v-if="membersLoading || permitsLoading" class="space-y-4">
        <USkeleton class="h-12 w-full" />
        <USkeleton class="h-48 w-full" />
      </div>

      <template v-else-if="permitsData?.isSaleActive">
        <!-- Member Selector -->
        <UFormField label="Für wen möchten Sie bestellen?">
          <USelectMenu
            v-model="selectedMemberId"
            :items="membersData?.members ?? []"
            value-key="id"
            class="w-full"
            placeholder="Mitglied auswählen"
          >
            <template #item="{ item }">
              <span>{{ item.firstName }} {{ item.lastName }}</span>
              <UBadge v-if="item.isSelf" variant="subtle" color="primary" class="ml-2">
                Ich selbst
              </UBadge>
            </template>
            <template #leading>
              <UIcon name="i-lucide-user" />
            </template>
          </USelectMenu>
        </UFormField>

        <!-- Existing Orders -->
        <div v-if="selectedMemberId && memberOrdersLoading" class="py-4">
          <USkeleton class="h-24 w-full" />
        </div>

        <UCard v-else-if="selectedMemberId && memberOrdersData?.orders?.length" variant="subtle">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-shopping-bag" class="size-5 text-primary" />
              <h3 class="font-semibold">
                Bereits gekaufte Erlaubnisscheine
              </h3>
            </div>
          </template>

          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            <div
              v-for="order in memberOrdersData.orders"
              :key="order.id"
              class="py-3 first:pt-0 last:pb-0"
            >
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ order.orderNumber }}</span>
                    <UBadge
                      :color="getStatusColor(order.status)"
                      variant="subtle"
                      size="xs"
                    >
                      {{ getStatusLabel(order.status) }}
                    </UBadge>
                  </div>
                  <p class="text-sm text-muted mt-1">
                    {{ formatDate(order.createdAt) }}
                  </p>
                  <ul class="mt-2 text-sm text-muted">
                    <li v-for="item in order.items.filter(i => i.itemType === 'PERMIT')" :key="item.id">
                      • {{ item.name }}
                    </li>
                  </ul>
                </div>
                <div class="text-right font-semibold">
                  {{ formatPrice(order.totalCents) }}
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Permits List -->
        <div v-if="selectedMemberId" class="space-y-6">
          <div
            v-for="permit in permitsData?.permits"
            :key="permit.id"
            class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <!-- Permit Header -->
            <div class="bg-gray-50 dark:bg-gray-800 px-4 py-3">
              <h3 class="font-semibold text-lg">
                {{ permit.name }}
              </h3>
              <p v-if="permit.waters.length" class="text-sm text-gray-500 dark:text-gray-400">
                Gültig für: {{ permit.waters.map(w => w.name).join(', ') }}
              </p>
            </div>

            <!-- Options -->
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              <div
                v-for="option in permit.options"
                :key="option.id"
                class="px-4 py-3"
              >
                <div class="flex items-start justify-between">
                  <div>
                    <h4 class="font-medium">
                      {{ option.name || 'Standard' }}
                    </h4>
                    <p v-if="option.description" class="text-sm text-gray-500 dark:text-gray-400">
                      {{ option.description }}
                    </p>
                  </div>
                </div>

                <!-- Periods -->
                <div class="mt-3 space-y-2">
                  <div
                    v-for="period in option.periods"
                    :key="period.id"
                    class="flex items-center justify-between p-3 rounded-lg border transition-colors"
                    :class="{
                      'border-primary-500 bg-primary-50 dark:bg-primary-900/20': isOptionSelected(permit.id, period.id) && !isPeriodOwned(period.id),
                      'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer': !isOptionSelected(permit.id, period.id) && !isPeriodOwned(period.id) && period.availableCount > 0,
                      'opacity-50 cursor-not-allowed': period.availableCount === 0 || isPeriodOwned(period.id),
                      'border-success-200 dark:border-success-700 bg-success-50 dark:bg-success-900/20': isPeriodOwned(period.id),
                    }"
                    @click="!isPeriodOwned(period.id) && period.availableCount > 0 && toggleOption(permit.id, period.id)"
                  >
                    <div class="flex items-center gap-3">
                      <URadio
                        v-if="!isPeriodOwned(period.id)"
                        :model-value="isOptionSelected(permit.id, period.id)"
                        :disabled="period.availableCount === 0"
                      />
                      <UIcon
                        v-else
                        name="i-lucide-check-circle"
                        class="size-5 text-success"
                      />
                      <div>
                        <p class="text-sm">
                          {{ formatDate(period.validFrom) }} - {{ formatDate(period.validTo) }}
                        </p>
                        <p v-if="isPeriodOwned(period.id)" class="text-xs text-success font-medium">
                          Bereits erworben
                        </p>
                        <p v-else class="text-xs text-gray-500 dark:text-gray-400">
                          {{ period.availableCount }} verfügbar
                        </p>
                      </div>
                    </div>
                    <div v-if="!isPeriodOwned(period.id)" class="font-semibold">
                      {{ formatPrice(period.priceCents) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Continue Button -->
        <div v-if="selectedMemberId" class="flex justify-end">
          <UButton
            size="lg"
            :disabled="!hasSelectedPermits"
            :loading="reserveMutation.isLoading.value"
            @click="handleContinue"
          >
            Weiter
            <template #trailing>
              <UIcon name="i-lucide-arrow-right" />
            </template>
          </UButton>
        </div>
      </template>
    </div>
  </UPageBody>
</template>
