<script lang="ts" setup>
import type { AvailablePermit, AvailablePermitOption, AvailablePermitPeriod } from '~~/server/actions/shop/get-available-permits'
import { useReservePermitsMutation } from '~/actions/shop/mutations'
import { useAvailablePermitsQuery, useSelectableMembersQuery } from '~/actions/shop/queries'

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

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
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
                    class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors"
                    :class="{
                      'border-primary-500 bg-primary-50 dark:bg-primary-900/20': isOptionSelected(permit.id, period.id),
                      'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600': !isOptionSelected(permit.id, period.id),
                      'opacity-50 cursor-not-allowed': period.availableCount === 0,
                    }"
                    @click="period.availableCount > 0 && toggleOption(permit.id, period.id)"
                  >
                    <div class="flex items-center gap-3">
                      <URadio
                        :model-value="isOptionSelected(permit.id, period.id)"
                        :disabled="period.availableCount === 0"
                      />
                      <div>
                        <p class="text-sm">
                          {{ formatDate(period.validFrom) }} - {{ formatDate(period.validTo) }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          {{ period.availableCount }} verfügbar
                        </p>
                      </div>
                    </div>
                    <div class="font-semibold">
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
