<script lang="ts" setup>
import { z } from 'zod'
import { useSelectableMembersQuery } from '~/actions/shop/queries'

const { club, clubSlug } = useClub()
const router = useRouter()
const checkoutStore = useShopCheckoutStore()
const toast = useToast()

// Redirect if no reservation
onMounted(() => {
  if (!checkoutStore.isReservationValid) {
    router.push(`/verein/${clubSlug.value}/shop`)
  }
})

// Form state
const formState = ref({
  street: checkoutStore.state.shippingAddress?.street ?? '',
  postalCode: checkoutStore.state.shippingAddress?.postalCode ?? '',
  city: checkoutStore.state.shippingAddress?.city ?? '',
  country: checkoutStore.state.shippingAddress?.country ?? 'Germany',
})

// Load member address as default
const memberId = computed(() => checkoutStore.state.memberId)
const clubId = computed(() => club.value?.id)

// Fetch member data to prefill address
const { data: membersData } = useQuery(
  useSelectableMembersQuery,
  () => ({ clubId: clubId.value! }),
)

watch([membersData, memberId], ([members, mId]) => {
  if (!members || !mId)
    return
  if (formState.value.street)
    return // Don't overwrite if already filled

  // Find member in list (this works for admin viewing members)
  const member = members.members.find((m: { id: string }) => m.id === mId)
  if (member) {
    formState.value = {
      street: member.street ?? '',
      postalCode: member.postalCode ?? '',
      city: member.city ?? '',
      country: member.country ?? 'Germany',
    }
  }
}, { immediate: true })

const validationSchema = z.object({
  street: z.string().min(1, 'Straße ist erforderlich'),
  postalCode: z.string().min(1, 'Postleitzahl ist erforderlich'),
  city: z.string().min(1, 'Stadt ist erforderlich'),
  country: z.string().min(1, 'Land ist erforderlich'),
})

const handleContinue = () => {
  const result = validationSchema.safeParse(formState.value)
  if (!result.success) {
    toast.add({
      title: 'Ungültige Eingabe',
      description: 'Bitte füllen Sie alle Adressfelder aus.',
      color: 'error',
    })
    return
  }

  checkoutStore.setShippingAddress({
    street: formState.value.street,
    postalCode: formState.value.postalCode,
    city: formState.value.city,
    country: formState.value.country,
  })

  router.push(`/verein/${clubSlug.value}/shop/confirm`)
}

const handleBack = () => {
  router.push(`/verein/${clubSlug.value}/shop/overview`)
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
          Lieferadresse
        </h2>
        <p class="text-gray-500 dark:text-gray-400">
          Für: {{ checkoutStore.state.memberName }}
        </p>
      </div>

      <!-- Address Form -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-map-pin" class="text-lg" />
            <span class="font-semibold">Versandadresse</span>
          </div>
        </template>

        <UForm :state="formState" class="space-y-4">
          <UFormField label="Straße und Hausnummer" name="street">
            <UInput
              v-model="formState.street"
              placeholder="Musterstraße 123"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Postleitzahl" name="postalCode">
              <UInput
                v-model="formState.postalCode"
                placeholder="12345"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Stadt" name="city">
              <UInput
                v-model="formState.city"
                placeholder="Musterstadt"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Land" name="country">
            <UInput
              v-model="formState.country"
              placeholder="Deutschland"
              class="w-full"
              disabled
            />
          </UFormField>
        </UForm>
      </UCard>

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
