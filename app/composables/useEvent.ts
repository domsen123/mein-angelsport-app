import { useEventsByClubIdQuery } from '~/actions/event/queries'

export const useEvent = () => {
  const byClubId = (clubId?: MaybeRefOrGetter<string>) => useQuery(useEventsByClubIdQuery, ({
    clubId: toValue(clubId!),
  }))

  return {
    byClubId,
  }
}
