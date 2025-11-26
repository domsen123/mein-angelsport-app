<script lang="ts" setup>
import type { SelectedPermit } from '~/composables/useShopCheckout'
import { useCreateOrderMutation } from '~/actions/shop/mutations'

const { club, clubSlug } = useClub()
const router = useRouter()
const checkoutStore = useShopCheckoutStore()
const toast = useToast()

const clubId = computed(() => club.value?.id)

// Redirect if no reservation
onMounted(() => {
  if (!checkoutStore.isReservationValid) {
    router.push(`/verein/${clubSlug.value}/shop`)
  }
})

// Mutation
const createOrderMutation = useCreateOrderMutation()

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
      discountCents,
      finalPriceCents: finalPrice,
    }
  })
})

const handlePlaceOrder = async () => {
  if (!clubId.value || !checkoutStore.state.memberId) {
    toast.add({
      title: 'Fehler',
      description: 'Ungültige Bestelldaten.',
      color: 'error',
    })
    return
  }

  if (!checkoutStore.state.shippingAddress) {
    toast.add({
      title: 'Fehler',
      description: 'Keine Lieferadresse angegeben.',
      color: 'error',
    })
    return
  }

  try {
    const permits = itemsWithPrices.value.map(item => ({
      permitInstanceId: item.permitInstanceId,
      permitName: item.permitName,
      optionName: item.optionName,
      optionId: item.optionId,
      originalPriceCents: item.priceCents,
      discountPercent: item.discountPercent,
    }))

    const workDutyInfo = checkoutStore.state.workDutyInfo
    const workDutyFee = workDutyInfo && workDutyInfo.totalFeeCents > 0
      ? {
          missing: workDutyInfo.missing,
          feePerDutyCents: workDutyInfo.feePerDutyCents,
          totalFeeCents: workDutyInfo.totalFeeCents,
        }
      : undefined

    await createOrderMutation.mutateAsync({
      clubId: clubId.value,
      memberId: checkoutStore.state.memberId,
      permits,
      workDutyFee,
      shippingAddress: checkoutStore.state.shippingAddress,
    })

    // Clear checkout state
    checkoutStore.reset()

    // Navigate to success page
    router.push(`/verein/${clubSlug.value}/shop/success`)
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.'
    toast.add({
      title: 'Bestellung fehlgeschlagen',
      description: message,
      color: 'error',
    })
  }
}

const handleBack = () => {
  router.push(`/verein/${clubSlug.value}/shop/shipping`)
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
          Bestellung bestätigen
        </h2>
        <p class="text-gray-500 dark:text-gray-400">
          Für: {{ checkoutStore.state.memberName }}
        </p>
      </div>

      <!-- Order Summary -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-file-text" class="text-lg" />
            <span class="font-semibold">Erlaubnisscheine</span>
          </div>
        </template>

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
                <p class="text-sm text-gray-500 dark:text-gray-400">
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
                  -{{ item.discountPercent }}% Rabatt
                </p>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Work Duty Fee Section -->
      <UCard v-if="checkoutStore.workDutyFeeCents > 0">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-hammer" class="text-lg" />
            <span class="font-semibold">Arbeitsdienst-Ausgleich</span>
          </div>
        </template>

        <div class="flex justify-between items-center">
          <p class="text-gray-600 dark:text-gray-300">
            {{ checkoutStore.state.workDutyInfo?.missing }} fehlende Arbeitsdienste
          </p>
          <p class="font-semibold">
            {{ formatPrice(checkoutStore.workDutyFeeCents) }}
          </p>
        </div>
      </UCard>

      <!-- Shipping Address -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-map-pin" class="text-lg" />
            <span class="font-semibold">Lieferadresse</span>
          </div>
        </template>

        <div class="text-gray-600 dark:text-gray-300">
          <p>{{ checkoutStore.state.shippingAddress?.street }}</p>
          <p>{{ checkoutStore.state.shippingAddress?.postalCode }} {{ checkoutStore.state.shippingAddress?.city }}</p>
          <p>{{ checkoutStore.state.shippingAddress?.country }}</p>
        </div>
      </UCard>

      <!-- Totals Section -->
      <UCard>
        <div class="space-y-2">
          <div class="flex justify-between text-gray-600 dark:text-gray-300">
            <span>Zwischensumme</span>
            <span>{{ formatPrice(checkoutStore.subtotalCents) }}</span>
          </div>
          <div v-if="checkoutStore.totalDiscountCents > 0" class="flex justify-between text-green-600 dark:text-green-400">
            <span>Rabatte</span>
            <span>-{{ formatPrice(checkoutStore.totalDiscountCents) }}</span>
          </div>
          <div v-if="checkoutStore.workDutyFeeCents > 0" class="flex justify-between text-gray-600 dark:text-gray-300">
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
      </UCard>

      <!-- Payment Notice -->
      <UAlert
        color="info"
        icon="i-lucide-info"
        title="Zahlungshinweis"
        description="Die Zahlung erfolgt per Rechnung. Sie erhalten die Rechnung nach Bestellbestätigung per E-Mail."
      />

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
          color="primary"
          :loading="createOrderMutation.isLoading.value"
          @click="handlePlaceOrder"
        >
          <template #leading>
            <UIcon name="i-lucide-check" />
          </template>
          Bestellung aufgeben
        </UButton>
      </div>
    </div>
  </UPageBody>
</template>
