<script lang="ts" setup>
import { useWorkDutyStatusQuery } from '~/actions/shop/queries'

const { club, clubSlug } = useClub()
const router = useRouter()
const checkoutStore = useShopCheckoutStore()

const clubId = computed(() => club.value?.id)
const memberId = computed(() => checkoutStore.state.memberId)

// Redirect if no reservation
onMounted(() => {
  if (!checkoutStore.isReservationValid) {
    router.push(`/verein/${clubSlug.value}/shop`)
  }
})

// Query work duty status
const { data: workDutyData, isLoading } = useQuery(
  useWorkDutyStatusQuery,
  () => ({ clubId: clubId.value!, memberId: memberId.value! }),
)

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)

const handleContinue = () => {
  if (!workDutyData.value)
    return

  // Store work duty info
  checkoutStore.setWorkDutyInfo({
    required: workDutyData.value.required,
    attended: workDutyData.value.attended,
    missing: workDutyData.value.missing,
    feePerDutyCents: workDutyData.value.feePerDutyCents,
    totalFeeCents: workDutyData.value.totalFeeCents,
    isExempt: workDutyData.value.isExempt,
  })

  // Navigate to step 3
  router.push(`/verein/${clubSlug.value}/shop/overview`)
}

const handleBack = () => {
  router.push(`/verein/${clubSlug.value}/shop`)
}
</script>

<template>
  <UPageBody>
    <div class="space-y-6">
      <!-- Reservation Timer -->
      <ShopReservationTimer />

      <!-- Header -->
      <div>
        <h2 class="text-xl font-semibold">
          Arbeitsdienst-Status
        </h2>
        <p class="text-gray-500 dark:text-gray-400">
          Für: {{ checkoutStore.state.memberName }}
        </p>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="space-y-4">
        <USkeleton class="h-32 w-full" />
      </div>

      <template v-else-if="workDutyData">
        <!-- Work Duty Summary Card -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-hammer" class="text-lg" />
              <span class="font-semibold">Arbeitsdienste {{ workDutyData.previousYear }}</span>
            </div>
          </template>

          <div class="space-y-4">
            <!-- Summary Grid -->
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <p class="text-2xl font-bold">
                  {{ workDutyData.required }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Erforderlich
                </p>
              </div>
              <div>
                <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                  {{ workDutyData.attended }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Geleistet
                </p>
              </div>
              <div>
                <p
                  class="text-2xl font-bold"
                  :class="{
                    'text-red-600 dark:text-red-400': workDutyData.missing > 0 && !workDutyData.isExempt,
                    'text-green-600 dark:text-green-400': workDutyData.missing === 0 || workDutyData.isExempt,
                  }"
                >
                  {{ workDutyData.missing }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Fehlend
                </p>
              </div>
            </div>

            <!-- Exempt Notice -->
            <UAlert
              v-if="workDutyData.isExempt"
              color="info"
              icon="i-lucide-badge-check"
              title="Befreit von Arbeitsdiensten"
              description="Basierend auf Ihrer Mitgliedschaftsrolle sind Sie von Arbeitsdiensten befreit."
            />

            <!-- Fee Notice -->
            <UAlert
              v-else-if="workDutyData.missing > 0"
              color="warning"
              icon="i-lucide-coins"
              title="Ausgleichsgebühr"
            >
              <template #description>
                <p>
                  {{ workDutyData.missing }} fehlende Arbeitsdienste × {{ formatPrice(workDutyData.feePerDutyCents) }}
                  = <strong>{{ formatPrice(workDutyData.totalFeeCents) }}</strong>
                </p>
              </template>
            </UAlert>

            <!-- All duties completed -->
            <UAlert
              v-else
              color="success"
              icon="i-lucide-check-circle"
              title="Alle Arbeitsdienste geleistet"
              description="Sie haben alle erforderlichen Arbeitsdienste für das vergangene Jahr absolviert."
            />
          </div>
        </UCard>
      </template>

      <!-- Navigation -->
      <div class="flex justify-between">
        <UButton
          variant="outline"
          @click="handleBack"
        >
          <template #leading>
            <UIcon name="i-lucide-arrow-left" />
          </template>
          Zurück
        </UButton>
        <UButton
          size="lg"
          @click="handleContinue"
        >
          Weiter
          <template #trailing>
            <UIcon name="i-lucide-arrow-right" />
          </template>
        </UButton>
      </div>
    </div>
  </UPageBody>
</template>
