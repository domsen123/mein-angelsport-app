<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

definePageMeta({
  layout: 'auth',
})

useSeoMeta({
  title: 'Anmelden',
  description: 'Melde dich bei deinem Konto an',
})

const fields = [{
  name: 'email',
  type: 'text' as const,
  label: 'Email',
  placeholder: 'Gebe deine Email ein',
  required: true,
}, {
  name: 'password',
  label: 'Passwort',
  type: 'password' as const,
  placeholder: 'Gebe dein Passwort ein',
  required: true,
}]

const schema = z.object({
  email: z.email('Bitte gebe eine gültige Email-Adresse ein'),
  password: z.string(),
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    const { email, password } = payload.data
    console.log({ email, password })
    await useAuth().signIn.email({
      email,
      password,
    })
    navigateTo('/')
  }
  catch (error: any) {
    console.error('Sign Up Error:', error)
  }
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    title="Willkommen zurück"
    icon="i-lucide-lock"
    :submit="{ label: 'Anmelden' }"
    :validate-on="['change']"
    loading-auto
    @submit="onSubmit"
  >
    <template #description>
      Du hast noch kein Konto? <ULink
        to="/auth/register"
        class="text-primary font-medium"
      >
        Jetzt Registrieren
      </ULink>.
    </template>
    <template #password-hint>
      <ULink
        to="/auth/forgot"
        class="text-primary font-medium"
        tabindex="-1"
      >
        Passwort vergessen?
      </ULink>
    </template>
  </UAuthForm>
</template>
