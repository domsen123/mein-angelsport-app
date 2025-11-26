import * as z from 'zod'
import { useCreateShopItemMutation, useUpdateShopItemMutation } from '~/actions/shop-admin/mutations'
import { useShopItemByIdQuery } from '~/actions/shop-admin/queries'

export const shopItemFormSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(255, 'Name darf maximal 255 Zeichen lang sein'),
  description: z.string().max(1000, 'Beschreibung darf maximal 1000 Zeichen lang sein').nullish().transform(v => v || null),
  priceCents: z.number().int().min(0, 'Preis muss positiv sein'),
  isStandalone: z.boolean(),
  autoAddOnPermitPurchase: z.boolean(),
  isActive: z.boolean(),
})

export type ShopItemFormState = z.infer<typeof shopItemFormSchema>

const defaultState = (): ShopItemFormState => ({
  name: '',
  description: null,
  priceCents: 0,
  isStandalone: false,
  autoAddOnPermitPurchase: false,
  isActive: true,
})

export const useShopItemPageForm = () => {
  const route = useRoute()
  const toast = useToast()
  const { club } = useClub()

  // Mode detection via route param
  const itemId = computed(() => route.params.itemId as string | undefined)
  const isCreateMode = computed(() => itemId.value === 'new')
  const isEditMode = computed(() => !!itemId.value && itemId.value !== 'new')

  // Form state
  const state = reactive<ShopItemFormState>(defaultState())

  // Get clubId
  const clubId = computed(() => club.value?.id)
  const clubSlug = computed(() => club.value?.slug)

  // Fetch item data in edit mode
  const { data: itemData, isLoading: isItemLoading } = useQuery(useShopItemByIdQuery, () => ({
    clubId: clubId.value!,
    itemId: itemId.value!,
  }))

  // Single watcher for form population
  watch([isCreateMode, itemData], ([isCreate, item]) => {
    if (isCreate) {
      Object.assign(state, defaultState())
    }
    else if (item) {
      state.name = item.name || ''
      state.description = item.description || null
      state.priceCents = item.priceCents || 0
      state.isStandalone = item.isStandalone || false
      state.autoAddOnPermitPurchase = item.autoAddOnPermitPurchase || false
      state.isActive = item.isActive ?? true
    }
  }, { immediate: true })

  // Mutations
  const createMutation = useCreateShopItemMutation()
  const updateMutation = useUpdateShopItemMutation()

  const isLoading = computed(() =>
    createMutation.isLoading.value
    || updateMutation.isLoading.value,
  )

  // Submit handler
  const submit = async () => {
    const currentClubId = clubId.value
    const currentSlug = clubSlug.value
    if (!currentClubId || !currentSlug)
      return

    try {
      if (isCreateMode.value) {
        await createMutation.mutateAsync({
          clubId: currentClubId,
          name: state.name,
          description: state.description,
          priceCents: state.priceCents,
          isStandalone: state.isStandalone,
          autoAddOnPermitPurchase: state.autoAddOnPermitPurchase,
          isActive: state.isActive,
        })
        toast.add({
          title: 'Shop-Artikel erstellt',
          description: `${state.name} wurde erfolgreich hinzugefügt.`,
          color: 'success',
        })
      }
      else if (isEditMode.value && itemId.value) {
        await updateMutation.mutateAsync({
          clubId: currentClubId,
          itemId: itemId.value,
          name: state.name,
          description: state.description,
          priceCents: state.priceCents,
          isStandalone: state.isStandalone,
          autoAddOnPermitPurchase: state.autoAddOnPermitPurchase,
          isActive: state.isActive,
        })
        toast.add({
          title: 'Shop-Artikel aktualisiert',
          description: `${state.name} wurde erfolgreich aktualisiert.`,
          color: 'success',
        })
      }
      // Navigate back to items list
      await navigateTo(`/verein/${currentSlug}/_admin/shop/items`)
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

  return {
    // Mode
    itemId,
    isCreateMode,
    isEditMode,
    // State
    state,
    itemData,
    // Loading
    isLoading,
    isItemLoading,
    // Actions
    submit,
  }
}
