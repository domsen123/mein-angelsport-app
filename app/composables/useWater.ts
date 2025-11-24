import { useWatersByClubIdQuery } from '~/actions/water/queries'

export const useWater = () => {
  const byClubId = (clubId?: MaybeRefOrGetter<string>) => useQuery(useWatersByClubIdQuery, ({
    clubId: toValue(clubId!),
  }))

  const getWaterType = (type: MaybeRefOrGetter<'lotic' | 'lentic'>) => computed(() => ({
    color: toValue(type) === 'lotic' ? 'info' as const : 'success' as const,
    label: toValue(type) === 'lotic' ? 'Fließgewässer' : 'Stillgewässer',
  }))

  return {
    byClubId,
    getWaterType,
  }
}
