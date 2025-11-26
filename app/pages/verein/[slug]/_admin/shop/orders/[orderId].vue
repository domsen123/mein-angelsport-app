<script lang="ts" setup>
import { useUpdateOrderMutation } from '~/actions/shop-admin/mutations'
import { useOrderByIdQuery } from '~/actions/shop-admin/queries'

const route = useRoute()
const { club } = useClub()
const toast = useToast()

const clubId = computed(() => club.value?.id)
const clubSlug = computed(() => club.value?.slug || '')
const orderId = computed(() => route.params.orderId as string)

const { data: order, isLoading, refetch } = useQuery(useOrderByIdQuery, () => ({
  clubId: clubId.value!,
  orderId: orderId.value,
}))

const updateMutation = useUpdateOrderMutation()

// Form state for editable fields
const formState = ref({
  status: '' as 'PENDING' | 'PAID' | 'FULFILLED' | 'CANCELLED',
  externalRef: '',
  notes: '',
})

// Sync form state with order data
watch(order, (newOrder) => {
  if (newOrder) {
    formState.value = {
      status: newOrder.status,
      externalRef: newOrder.externalRef || '',
      notes: newOrder.notes || '',
    }
  }
}, { immediate: true })

const statusOptions = [
  { label: 'Ausstehend', value: 'PENDING' },
  { label: 'Bezahlt', value: 'PAID' },
  { label: 'Abgeschlossen', value: 'FULFILLED' },
  { label: 'Storniert', value: 'CANCELLED' },
]

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)

const formatDate = (date: Date | string) => {
  const d = new Date(date)
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

const _getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING': return 'warning'
    case 'PAID': return 'info'
    case 'FULFILLED': return 'success'
    case 'CANCELLED': return 'error'
    default: return 'neutral'
  }
}

const _getStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING': return 'Ausstehend'
    case 'PAID': return 'Bezahlt'
    case 'FULFILLED': return 'Abgeschlossen'
    case 'CANCELLED': return 'Storniert'
    default: return status
  }
}

const getItemTypeLabel = (type: string) => {
  switch (type) {
    case 'PERMIT': return 'Erlaubnisschein'
    case 'SHOP_ITEM': return 'Shop-Artikel'
    case 'WORK_DUTY_FEE': return 'Arbeitsdienst-Gebühr'
    default: return type
  }
}

const handleSave = async () => {
  if (!clubId.value)
    return

  try {
    await updateMutation.mutateAsync({
      clubId: clubId.value,
      orderId: orderId.value,
      status: formState.value.status,
      externalRef: formState.value.externalRef || null,
      notes: formState.value.notes || null,
    })
    toast.add({
      title: 'Bestellung aktualisiert',
      description: 'Die Bestellung wurde erfolgreich aktualisiert.',
      color: 'success',
    })
    refetch()
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten.'
    toast.add({
      title: 'Fehler',
      description: message,
      color: 'error',
    })
  }
}
</script>

<template>
  <div v-if="isLoading" class="flex items-center justify-center py-8">
    <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
    <span class="sr-only">Laden...</span>
  </div>

  <div v-else-if="order" class="lg:max-w-4xl space-y-6">
    <!-- Header -->
    <UPageCard
      :title="`Bestellung ${order.orderNumber}`"
      :description="`Erstellt am ${formatDate(order.createdAt)}`"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <div class="flex gap-2 w-fit lg:ms-auto">
        <UButton
          :to="`/verein/${clubSlug}/_admin/shop/orders`"
          color="neutral"
          variant="outline"
          icon="i-lucide-arrow-left"
        >
          Zurück
        </UButton>
        <UButton
          label="Speichern"
          color="primary"
          :loading="updateMutation.isLoading.value"
          @click="handleSave"
        />
      </div>
    </UPageCard>

    <!-- Status & Info -->
    <UPageCard
      title="Bestellinformationen"
      description="Empfänger, Käufer und Status"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard variant="subtle">
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Empfänger
          </p>
          <p class="font-medium">
            {{ order.member?.firstName }} {{ order.member?.lastName }}
          </p>
          <p v-if="order.member?.email" class="text-sm text-gray-500">
            {{ order.member.email }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Käufer
          </p>
          <p v-if="order.buyer?.id === order.member?.id" class="font-medium">
            Selbst
          </p>
          <template v-else>
            <p class="font-medium">
              {{ order.buyer?.firstName }} {{ order.buyer?.lastName }}
            </p>
            <p v-if="order.buyer?.email" class="text-sm text-gray-500">
              {{ order.buyer.email }}
            </p>
          </template>
        </div>
      </div>

      <div class="mt-4">
        <UFormField label="Status" class="grid md:grid-cols-2 gap-4">
          <USelect
            v-model="formState.status"
            :items="statusOptions"
            value-key="value"
            class="w-full"
          />
        </UFormField>
      </div>
    </UPageCard>

    <!-- Shipping Address -->
    <UPageCard
      title="Lieferadresse"
      description="Versandadresse für die Bestellung"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard v-if="order.shippingAddress" variant="subtle">
      <div class="text-gray-600 dark:text-gray-300">
        <p>{{ order.shippingAddress.street }}</p>
        <p>{{ order.shippingAddress.postalCode }} {{ order.shippingAddress.city }}</p>
        <p>{{ order.shippingAddress.country }}</p>
      </div>
    </UPageCard>
    <UCard v-else variant="subtle">
      <p class="text-gray-500">
        Keine Lieferadresse angegeben.
      </p>
    </UCard>

    <!-- Order Items -->
    <UPageCard
      title="Bestellpositionen"
      description="Artikel in dieser Bestellung"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard variant="subtle">
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        <div
          v-for="item in order.items"
          :key="item.id"
          class="py-3 first:pt-0 last:pb-0"
        >
          <div class="flex justify-between items-start">
            <div>
              <p class="font-medium">
                {{ item.name }}
              </p>
              <p v-if="item.description" class="text-sm text-gray-500 dark:text-gray-400">
                {{ item.description }}
              </p>
              <UBadge :color="item.itemType === 'PERMIT' ? 'primary' : 'neutral'" variant="subtle" size="xs" class="mt-1">
                {{ getItemTypeLabel(item.itemType) }}
              </UBadge>
            </div>
            <div class="text-right">
              <p v-if="item.discountPercent > 0" class="text-sm line-through text-gray-400">
                {{ formatPrice(item.originalPriceCents) }}
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
    </UPageCard>

    <!-- Totals -->
    <UPageCard
      title="Summen"
      description="Preisübersicht"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard variant="subtle">
      <div class="space-y-2">
        <div class="flex justify-between text-gray-600 dark:text-gray-300">
          <span>Zwischensumme</span>
          <span>{{ formatPrice(order.subtotalCents) }}</span>
        </div>
        <div v-if="order.discountCents > 0" class="flex justify-between text-green-600 dark:text-green-400">
          <span>Rabatte</span>
          <span>-{{ formatPrice(order.discountCents) }}</span>
        </div>
        <div v-if="order.workDutyFeeCents > 0" class="flex justify-between text-gray-600 dark:text-gray-300">
          <span>Arbeitsdienst-Ausgleich</span>
          <span>{{ formatPrice(order.workDutyFeeCents) }}</span>
        </div>
        <div class="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
          <div class="flex justify-between text-lg font-bold">
            <span>Gesamtsumme</span>
            <span>{{ formatPrice(order.totalCents) }}</span>
          </div>
        </div>
      </div>
    </UPageCard>

    <!-- Admin Fields -->
    <UPageCard
      title="Verwaltung"
      description="Externe Referenzen und Notizen"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard variant="subtle">
      <UFormField
        label="Externe Referenz"
        description="Verweis auf externes System (z.B. Rechnungsnummer)"
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput
          v-model="formState.externalRef"
          placeholder="z.B. Rechnungsnr. 2025-0001"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Notizen"
        description="Interne Anmerkungen zur Bestellung"
        class="grid md:grid-cols-2 gap-4"
      >
        <UTextarea
          v-model="formState.notes"
          placeholder="Optionale Notizen..."
          class="w-full"
        />
      </UFormField>
    </UPageCard>
  </div>
</template>
