<script lang="ts" setup>
import { shopItemFormSchema } from '~/composables/useShopItemPageForm'

const { club } = useClub()
const clubSlug = computed(() => club.value?.slug || '')

const {
  isEditMode,
  isCreateMode,
  state,
  itemData,
  isLoading,
  isItemLoading,
  submit,
} = useShopItemPageForm()

const onSubmit = () => submit()

// Page title
const pageTitle = computed(() => {
  if (isCreateMode.value)
    return 'Neuer Shop-Artikel'
  if (itemData.value)
    return itemData.value.name
  return 'Shop-Artikel bearbeiten'
})

const pageDescription = computed(() => {
  return isCreateMode.value
    ? 'Füge einen neuen Shop-Artikel hinzu'
    : 'Bearbeite die Artikeldetails'
})

// Price display helper - convert cents to euros for input
const priceInEuros = computed({
  get: () => state.priceCents / 100,
  set: (value: number) => {
    state.priceCents = Math.round(value * 100)
  },
})
</script>

<template>
  <div v-if="isItemLoading && isEditMode" class="flex items-center justify-center py-8">
    <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
    <span class="sr-only">Laden...</span>
  </div>

  <UForm v-else id="shop-item-form" :schema="shopItemFormSchema" :state="state" class="lg:max-w-3xl" @submit="onSubmit">
    <UPageCard
      :title="pageTitle"
      :description="pageDescription"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <div class="flex gap-2 w-fit lg:ms-auto">
        <UButton
          :to="`/verein/${clubSlug}/_admin/shop/items`"
          color="neutral"
          variant="outline"
          icon="i-lucide-arrow-left"
        >
          Zurück
        </UButton>
        <UButton
          form="shop-item-form"
          label="Speichern"
          color="primary"
          type="submit"
          :loading="isLoading"
        />
      </div>
    </UPageCard>

    <!-- Basic Info -->
    <UPageCard
      title="Artikelinformationen"
      description="Name, Beschreibung und Preis des Artikels"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard variant="subtle">
      <UFormField
        name="name"
        label="Name"
        description="Name des Shop-Artikels"
        required
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput v-model="state.name" placeholder="z.B. Aktiv Mitgliedschaft" class="w-full" />
      </UFormField>
      <UFormField
        name="description"
        label="Beschreibung"
        description="Optionale Beschreibung des Artikels"
        class="grid md:grid-cols-2 gap-4"
      >
        <UTextarea v-model="state.description" placeholder="Optionale Beschreibung" class="w-full" />
      </UFormField>
      <UFormField
        name="priceCents"
        label="Preis"
        description="Preis in Euro"
        required
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput
          v-model.number="priceInEuros"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          class="w-full"
        >
          <template #trailing>
            <span class="text-gray-500">€</span>
          </template>
        </UInput>
      </UFormField>
    </UPageCard>

    <!-- Settings -->
    <UPageCard
      title="Einstellungen"
      description="Verhalten und Verfügbarkeit des Artikels"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard variant="subtle">
      <UFormField
        name="isActive"
        label="Aktiv"
        description="Deaktivierte Artikel werden im Shop nicht angezeigt"
        class="grid md:grid-cols-2 gap-4"
      >
        <div class="flex items-center justify-end">
          <USwitch v-model="state.isActive" />
        </div>
      </UFormField>
      <UFormField
        name="autoAddOnPermitPurchase"
        label="Automatisch hinzufügen"
        description="Wird automatisch bei jedem Erlaubnisscheinkauf hinzugefügt"
        class="grid md:grid-cols-2 gap-4"
      >
        <div class="flex items-center justify-end">
          <USwitch v-model="state.autoAddOnPermitPurchase" />
        </div>
      </UFormField>
      <UFormField
        name="isStandalone"
        label="Einzeln kaufbar"
        description="Kann ohne Erlaubnisschein gekauft werden (derzeit nicht implementiert)"
        class="grid md:grid-cols-2 gap-4"
      >
        <div class="flex items-center justify-end">
          <USwitch v-model="state.isStandalone" disabled />
        </div>
      </UFormField>
    </UPageCard>
  </UForm>
</template>
