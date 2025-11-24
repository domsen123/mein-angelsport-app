<script lang="ts" setup>
import type { AuthFormField, FormSubmitEvent } from '#ui/types'
import { z } from 'zod'

definePageMeta({
  layout: 'auth',
})

useSeoMeta({
  title: 'Mitgliedschaft bestätigen',
  description: 'Verknüpfen Sie Ihre Vereinsmitgliedschaft mit Ihrem Konto',
})

const router = useRouter()
const clubId = useRouteQuery<string | undefined>('club')
const validationToken = useRouteQuery<string | undefined>('token')

// Redirect if required params are missing
if (!clubId.value || !validationToken.value) {
  await navigateTo('/auth/sign-in')
}

const fields: AuthFormField[] = [{
  name: 'firstName',
  type: 'text' as const,
  label: 'Vorname',
  placeholder: 'Dein Vorname',
  required: true,
}, {
  name: 'lastName',
  type: 'text' as const,
  label: 'Nachname',
  placeholder: 'Dein Nachname',
  required: true,
}, {
  name: 'birthday',
  type: 'text' as const,
  label: 'Geburtsdatum',
  required: true,
  defaultValue: '',
}]

const schema = z.object({
  firstName: z.string().min(1, 'Bitte Vornamen eingeben').max(100),
  lastName: z.string().min(1, 'Bitte Nachnamen eingeben').max(100),

})
type Schema = z.output<typeof schema>

async function onSubmit(_payload: FormSubmitEvent<Schema>) {
  if (!clubId.value || !validationToken.value) {
    return
  }

  try {
    // TODO
  }
  catch (error) {
    console.error('Validation failed:', error)
  }
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    title="Mitgliedschaft bestätigen"
    icon="i-lucide-user-check"
    :submit="{ label: 'Mitgliedschaft bestätigen' }"
    :validate-on="['change']"
    @submit="onSubmit"
  >
    <template #description>
      Bitte geben Sie Ihre persönlichen Daten ein, um Ihre Vereinsmitgliedschaft mit Ihrem Konto zu verknüpfen.
    </template>
  </UAuthForm>
</template>

<style></style>
