<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'
import { useUpdateClubMutation } from '~/actions/club/mutations'

const toast = useToast()
const { club, isLoading: isClubLoading } = useClub()

const schema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(40, 'Name darf maximal 40 Zeichen lang sein'),
  shortName: z.string().min(1, 'Kurzname ist erforderlich').max(15, 'Kurzname darf maximal 15 Zeichen lang sein'),
  workDutiesPerYear: z.coerce.number().int().min(0, 'Muss 0 oder größer sein'),
  workDutyPriceEuro: z.string().max(10).nullable().optional(),
  permitSaleStartDay: z.string().max(2).nullable().optional(),
  permitSaleStartMonth: z.string().max(2).nullable().optional(),
  permitSaleEndDay: z.string().max(2).nullable().optional(),
  permitSaleEndMonth: z.string().max(2).nullable().optional(),
})

type Schema = z.output<typeof schema>

// Helper functions for cents <-> euro conversion
const formatCentsToEuro = (cents: string | null | undefined): string => {
  if (!cents)
    return ''
  const num = Number.parseInt(cents, 10)
  if (Number.isNaN(num))
    return ''
  return (num / 100).toFixed(2).replace('.', ',')
}

const euroToCents = (euro: string | null | undefined): string | null => {
  if (!euro)
    return null
  const cleaned = euro.replace(/[€\s]/g, '').replace(',', '.')
  const num = Number.parseFloat(cleaned)
  if (Number.isNaN(num))
    return null
  return Math.round(num * 100).toString()
}

const state = reactive<Schema>({
  name: '',
  shortName: '',
  workDutiesPerYear: 0,
  workDutyPriceEuro: null,
  permitSaleStartDay: null,
  permitSaleStartMonth: null,
  permitSaleEndDay: null,
  permitSaleEndMonth: null,
})

// Parse DD-MM format into separate day/month
const parseDateString = (dateStr: string | null | undefined) => {
  if (!dateStr)
    return { day: null, month: null }
  const [day, month] = dateStr.split('-')
  return { day: day || null, month: month || null }
}

// Format day/month back to DD-MM
const formatDateString = (day: string | null | undefined, month: string | null | undefined) => {
  if (!day || !month)
    return null
  return `${day.padStart(2, '0')}-${month.padStart(2, '0')}`
}

// Populate form when club data is loaded
watch(() => club.value, (clubData) => {
  if (clubData) {
    state.name = clubData.name
    state.shortName = clubData.shortName || ''
    state.workDutiesPerYear = clubData.workDutiesPerYear ?? 0
    state.workDutyPriceEuro = formatCentsToEuro(clubData.workDutyPriceCents) || null

    const start = parseDateString(clubData.permitSaleStart)
    state.permitSaleStartDay = start.day
    state.permitSaleStartMonth = start.month

    const end = parseDateString(clubData.permitSaleEnd)
    state.permitSaleEndDay = end.day
    state.permitSaleEndMonth = end.month
  }
}, { immediate: true })

const updateClubMutation = useUpdateClubMutation()

const onSubmit = async (_event: FormSubmitEvent<Schema>) => {
  if (!club.value)
    return

  try {
    await updateClubMutation.mutateAsync({
      clubId: club.value.id,
      name: state.name,
      shortName: state.shortName,
      workDutiesPerYear: state.workDutiesPerYear,
      workDutyPriceCents: euroToCents(state.workDutyPriceEuro),
      permitSaleStart: formatDateString(state.permitSaleStartDay, state.permitSaleStartMonth),
      permitSaleEnd: formatDateString(state.permitSaleEndDay, state.permitSaleEndMonth),
    })

    toast.add({
      title: 'Einstellungen gespeichert',
      description: 'Die Vereinseinstellungen wurden erfolgreich aktualisiert.',
      color: 'success',
    })
  }
  catch {
    toast.add({
      title: 'Fehler beim Speichern',
      description: 'Die Einstellungen konnten nicht gespeichert werden.',
      color: 'error',
    })
  }
}
</script>

<template>
  <div v-if="isClubLoading" class="flex items-center justify-center py-8">
    <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
  </div>

  <UForm v-else id="settings" :schema="schema" :state="state" class="lg:max-w-3xl" @submit="onSubmit">
    <UPageCard
      :title="club?.name || 'Verein'"
      description="Globale Einstellungen für den Verein"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton form="settings" label="Speichern" color="primary" type="submit" :loading="updateClubMutation.isLoading.value" class="w-fit lg:ms-auto" />
    </UPageCard>
    <UPageCard variant="subtle">
      <UFormField
        name="name"
        label="Name"
        description="Name des Vereins"
        required
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput v-model="state.name" autocomplete="off" class="w-full" />
      </UFormField>
      <UFormField
        name="shortName"
        label="Kurzname"
        description="Kurzname des Vereins für mobile Ansicht"
        required
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput v-model="state.shortName" autocomplete="off" class="w-full" />
      </UFormField>
      <UFormField
        name="slug"
        label="URL"
        :description="`https://mein-angelsport.de/verein/${club?.slug || ''}`"
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput :model-value="club?.slug" disabled autocomplete="off" class="w-full" />
      </UFormField>
    </UPageCard>
    <UPageCard
      title="Arbeitseinsätze"
      description="Arbeitseinsatz-Einstellungen für den Verein"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard variant="subtle">
      <UFormField
        name="workDutiesPerYear"
        label="Arbeitseinsätze pro Jahr"
        description="Anzahl der zu leistenden Arbeitseinsätze"
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput v-model="state.workDutiesPerYear" type="number" min="0" autocomplete="off" class="w-full" />
      </UFormField>
      <UFormField
        name="workDutyPriceEuro"
        label="Kosten pro Arbeitseinsatz (€)"
        description="Kosten pro nicht geleisteten Arbeitseinsatz"
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput v-model="state.workDutyPriceEuro" autocomplete="off" class="w-full" placeholder="25,00" />
      </UFormField>
    </UPageCard>
    <UPageCard
      title="Verkaufsstart"
      description="Jahreskarten Verkaufsstart für den Verein"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard variant="subtle">
      <UFormField
        name="permitSaleStart"
        label="Verkaufsstart"
        description="Datum des Verkaufsstarts"
        class="grid md:grid-cols-2 gap-4"
      >
        <div class="flex items-end gap-2">
          <UInput v-model="state.permitSaleStartDay" type="text" pattern="[0-9]*" maxlength="2" class="flex-1" placeholder="DD" />
          <div>.</div>
          <UInput v-model="state.permitSaleStartMonth" type="text" pattern="[0-9]*" maxlength="2" class="flex-1" placeholder="MM" />
        </div>
      </UFormField>
      <UFormField
        name="permitSaleEnd"
        label="Verkaufsende"
        description="Datum des Verkaufsendes"
        class="grid md:grid-cols-2 gap-4"
      >
        <div class="flex items-end gap-2">
          <UInput v-model="state.permitSaleEndDay" type="text" pattern="[0-9]*" maxlength="2" class="flex-1" placeholder="DD" />
          <div>.</div>
          <UInput v-model="state.permitSaleEndMonth" type="text" pattern="[0-9]*" maxlength="2" class="flex-1" placeholder="MM" />
        </div>
      </UFormField>
    </UPageCard>
  </UForm>
</template>

<style></style>
