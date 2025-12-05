import type { NavigationMenuItem } from '@nuxt/ui'

const navigation = ref<NavigationMenuItem[][]>([])

export const useMobileNavigation = () => {
  const setNavigation = (items: NavigationMenuItem[][]) => {
    navigation.value = items
  }

  return {
    navigation: computed(() => navigation.value),
    setNavigation,
  }
}
