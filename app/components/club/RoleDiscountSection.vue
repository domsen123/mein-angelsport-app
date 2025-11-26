<script lang="ts" setup>
import type { DiscountItem } from '~/actions/clubRoleDiscounts/api'
import { usePermitOptionsByClubIdQuery } from '~/actions/permits/queries'
import { useDiscountsByRoleIdQuery } from '~/actions/clubRoleDiscounts/queries'
import {
  useCreateDiscountMutation,
  useDeleteDiscountMutation,
  useUpdateDiscountMutation,
} from '~/actions/clubRoleDiscounts/mutations'

const props = defineProps<{
  clubId: string
  roleId: string
}>()

const toast = useToast()

// Fetch existing discounts for this role
const { data: discounts, isLoading: isDiscountsLoading } = useQuery(
  useDiscountsByRoleIdQuery({ clubId: props.clubId, roleId: props.roleId }),
)

// Fetch all permit options for the club
const { data: permitOptions, isLoading: isOptionsLoading } = useQuery(
  usePermitOptionsByClubIdQuery({ clubId: props.clubId }),
)

// Selected permit option for adding new discount
const selectedPermitOption = ref<string | undefined>(undefined)
const newDiscountPercent = ref<number>(0)

// Computed: already assigned permit option IDs
const assignedPermitOptionIds = computed(() =>
  new Set(discounts.value?.map(d => d.permitOptionId) ?? []),
)

// Computed: available permit options (not yet assigned)
const availablePermitOptions = computed(() => {
  if (!permitOptions.value)
    return []
  return permitOptions.value
    .filter(po => !assignedPermitOptionIds.value.has(po.id))
    .map(po => ({
      label: po.permitName ? `${po.permitName} - ${po.name || 'Option'}` : (po.name || 'Option'),
      value: po.id,
    }))
})

// Mutations
const createMutation = useCreateDiscountMutation()
const updateMutation = useUpdateDiscountMutation()
const deleteMutation = useDeleteDiscountMutation()

// Add discount
const addDiscount = async () => {
  if (!selectedPermitOption.value)
    return

  try {
    await createMutation.mutateAsync({
      clubId: props.clubId,
      clubRoleId: props.roleId,
      permitOptionId: selectedPermitOption.value,
      discountPercent: newDiscountPercent.value,
    })
    selectedPermitOption.value = undefined
    newDiscountPercent.value = 0
    toast.add({
      title: 'Rabatt hinzugefügt',
      color: 'success',
    })
  }
  catch (error: any) {
    toast.add({
      title: 'Fehler',
      description: error?.message || 'Rabatt konnte nicht hinzugefügt werden.',
      color: 'error',
    })
  }
}

// Update discount
const updateDiscount = async (discountId: string, discountPercent: number) => {
  try {
    await updateMutation.mutateAsync({
      clubId: props.clubId,
      roleId: props.roleId,
      discountId,
      discountPercent,
    })
    toast.add({
      title: 'Rabatt aktualisiert',
      color: 'success',
    })
  }
  catch (error: any) {
    toast.add({
      title: 'Fehler',
      description: error?.message || 'Rabatt konnte nicht aktualisiert werden.',
      color: 'error',
    })
  }
}

// Delete discount
const removeDiscount = async (discountId: string) => {
  try {
    await deleteMutation.mutateAsync({
      clubId: props.clubId,
      roleId: props.roleId,
      discountId,
    })
    toast.add({
      title: 'Rabatt entfernt',
      color: 'success',
    })
  }
  catch (error: any) {
    toast.add({
      title: 'Fehler',
      description: error?.message || 'Rabatt konnte nicht entfernt werden.',
      color: 'error',
    })
  }
}

// Helper to format permit option display name
const getPermitOptionDisplayName = (discount: DiscountItem) => {
  const permitName = discount.permitOption?.permit?.name ?? ''
  const optionName = discount.permitOption?.name ?? 'Option'
  return permitName ? `${permitName} - ${optionName}` : optionName
}
</script>

<template>
  <UPageCard variant="subtle">
    <!-- Loading state -->
    <div v-if="isDiscountsLoading || isOptionsLoading" class="flex items-center justify-center py-4">
      <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-primary" />
    </div>

    <template v-else>
      <!-- Existing discounts -->
      <div v-if="discounts && discounts.length > 0" class="space-y-3 mb-4">
        <div
          v-for="discount in discounts"
          :key="discount.id"
          class="flex items-center gap-3 p-3 bg-elevated rounded-lg"
        >
          <span class="flex-1 text-sm font-medium">
            {{ getPermitOptionDisplayName(discount) }}
          </span>
          <div class="flex items-center gap-2">
            <UInput
              type="number"
              :model-value="discount.discountPercent"
              min="0"
              max="100"
              class="w-20"
              @update:model-value="(val) => updateDiscount(discount.id, Number(val))"
              @blur="updateDiscount(discount.id, discount.discountPercent)"
            />
            <span class="text-sm text-muted">%</span>
            <UButton
              icon="i-lucide-trash-2"
              size="xs"
              color="error"
              variant="ghost"
              :loading="deleteMutation.isLoading.value"
              @click="removeDiscount(discount.id)"
            />
          </div>
        </div>
      </div>

      <div v-else class="text-sm text-muted mb-4">
        Keine Rabatte konfiguriert
      </div>

      <!-- Add new discount -->
      <div v-if="availablePermitOptions.length > 0" class="flex gap-2 items-end">
        <div class="flex-1">
          <label class="text-sm font-medium mb-1 block">Erlaubnisschein Option</label>
          <USelectMenu
            v-model="selectedPermitOption"
            :items="availablePermitOptions"
            placeholder="Option auswählen..."
            class="w-full"
            value-key="value"
          />
        </div>
        <div class="w-24">
          <label class="text-sm font-medium mb-1 block">Rabatt %</label>
          <UInput
            v-model="newDiscountPercent"
            type="number"
            min="0"
            max="100"
            placeholder="0"
            class="w-full"
          />
        </div>
        <UButton
          :disabled="!selectedPermitOption"
          :loading="createMutation.isLoading.value"
          icon="i-lucide-plus"
          @click="addDiscount"
        >
          Hinzufügen
        </UButton>
      </div>

      <div v-else-if="permitOptions && permitOptions.length === 0" class="text-sm text-muted">
        Keine Erlaubnisschein-Optionen verfügbar. Erstellen Sie zuerst Erlaubnisscheine mit Optionen.
      </div>

      <div v-else-if="discounts && discounts.length > 0 && availablePermitOptions.length === 0" class="text-sm text-muted">
        Alle verfügbaren Erlaubnisschein-Optionen haben bereits einen Rabatt.
      </div>
    </template>
  </UPageCard>
</template>
