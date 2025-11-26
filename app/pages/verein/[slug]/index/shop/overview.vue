<script lang="ts" setup>
import type { SelectedPermit } from '~/composables/useShopCheckout'
import { useMemberDiscountsQuery } from '~/actions/shop/queries'

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

// Query discounts
const { data: discountsData, isLoading } = useQuery(
  useMemberDiscountsQuery,
  () => ({ clubId: clubId.value!, memberId: memberId.value! }),
)

// When discounts load, update store
watch(discountsData, (data) => {
  if (data) {
    checkoutStore.setDiscounts(data.discounts)
  }
}, { immediate: true })

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)

// Calculate prices with discounts
const itemsWithPrices = computed(() => {
  return checkoutStore.state.selectedPermits.map((permit: SelectedPermit) => {
    const discount = checkoutStore.getDiscountForOption(permit.optionId)
    const discountCents = discount
      ? Math.floor(permit.priceCents * discount.discountPercent / 100)
      : 0
    const finalPrice = permit.priceCents - discountCents

    return {
      ...permit,
      discountPercent: discount?.discountPercent ?? 0,
      discountRoleName: discount?.roleName ?? null,
      discountCents,
      finalPriceCents: finalPrice,
    }
  })
})

const handleContinue = () => {
  router.push(`/verein/${clubSlug.value}/shop/shipping`)
}

const handleBack = () => {
  router.push(`/verein/${clubSlug.value}/shop/work-duties`)
}
</script>

<template>
  <UPageBody>
    <div class="space-y-6">
      <!-- Reservation Timer -->
      <ShopReservationTimer />

      <!-- Header -->
      <UPageCard
        title="Bestellübersicht"
        :description="`Für: ${checkoutStore.state.memberName}`"
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      />

      <!-- Loading -->
      <div v-if="isLoading" class="space-y-4">
        <USkeleton class="h-48 w-full" />
      </div>

      <template v-else>
        <!-- Permits Section -->
        <UPageCard
          title="Erlaubnisscheine"
          description="Ausgewählte Erlaubnisscheine und Preise"
          variant="naked"
          orientation="horizontal"
          class="mb-4"
        />
        <UPageCard variant="subtle">
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            <div
              v-for="item in itemsWithPrices"
              :key="item.permitInstanceId"
              class="py-3 first:pt-0 last:pb-0"
            >
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium">
                    {{ item.permitName }}
                  </p>
                  <p class="text-sm text-muted">
                    {{ item.optionName }}
                  </p>
                </div>
                <div class="text-right">
                  <p v-if="item.discountPercent > 0" class="text-sm line-through text-gray-400">
                    {{ formatPrice(item.priceCents) }}
                  </p>
                  <p class="font-semibold">
                    {{ formatPrice(item.finalPriceCents) }}
                  </p>
                  <p v-if="item.discountPercent > 0" class="text-sm text-green-600 dark:text-green-400">
                    -{{ item.discountPercent }}% ({{ item.discountRoleName }})
                  </p>
                </div>
              </div>
            </div>
          </div>
        </UPageCard>

        <!-- Work Duty Fee Section -->
        <template v-if="checkoutStore.workDutyFeeCents > 0">
          <UPageCard
            title="Arbeitsdienst-Ausgleich"
            description="Gebühr für nicht geleistete Arbeitsdienste"
            variant="naked"
            orientation="horizontal"
            class="mt-8 mb-4"
          />
          <UPageCard variant="subtle">
            <div class="flex justify-between items-center">
              <p class="text-muted">
                {{ checkoutStore.state.workDutyInfo?.missing }} fehlende Arbeitsdienste
              </p>
              <p class="font-semibold">
                {{ formatPrice(checkoutStore.workDutyFeeCents) }}
              </p>
            </div>
          </UPageCard>
        </template>

        <!-- Totals Section -->
        <UPageCard
          title="Zusammenfassung"
          description="Gesamtübersicht der Kosten"
          variant="naked"
          orientation="horizontal"
          class="mt-8 mb-4"
        />
        <UPageCard variant="subtle">
          <div class="space-y-2">
            <div class="flex justify-between text-muted">
              <span>Zwischensumme</span>
              <span>{{ formatPrice(checkoutStore.subtotalCents) }}</span>
            </div>
            <div v-if="checkoutStore.totalDiscountCents > 0" class="flex justify-between text-green-600 dark:text-green-400">
              <span>Rabatte</span>
              <span>-{{ formatPrice(checkoutStore.totalDiscountCents) }}</span>
            </div>
            <div v-if="checkoutStore.workDutyFeeCents > 0" class="flex justify-between text-muted">
              <span>Arbeitsdienst-Ausgleich</span>
              <span>{{ formatPrice(checkoutStore.workDutyFeeCents) }}</span>
            </div>
            <div class="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <div class="flex justify-between text-lg font-bold">
                <span>Gesamtsumme</span>
                <span>{{ formatPrice(checkoutStore.totalCents) }}</span>
              </div>
            </div>
          </div>
        </UPageCard>
      </template>

      <!-- Navigation -->
      <div class="flex justify-between mt-8">
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
