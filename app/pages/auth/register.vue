<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

definePageMeta({
  layout: 'auth',
})

useSeoMeta({
  title: 'Passwort zurücksetzen',
  description: 'Setze dein Passwort zurück',
})

const fields = [{
  name: 'name',
  type: 'text' as const,
  label: 'Name',
  placeholder: 'Dein Name',
  required: true,
}, {
  name: 'email',
  type: 'text' as const,
  label: 'Email',
  placeholder: 'Deine Email Adresse',
  required: true,
}, {
  name: 'password',
  label: 'Passwort',
  type: 'password' as const,
  placeholder: 'Ein sicheres Passwort',
  required: true,
}]

const schema = z.object({
  name: z.string().min(1, { message: 'Bitte gebe deinen Namen ein' }),
  email: z.email('Bitte gebe eine gültige Email-Adresse ein'),
  password: z.string().min(6, { message: 'Das Passwort muss mindestens 6 Zeichen lang sein' }),
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    const { name, email, password } = payload.data
    await useAuth().signUp.email({
      name,
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
    title="Konto erstellen"
    icon="i-lucide-user-plus"
    :submit="{ label: 'Registrieren' }"
    :validate-on="['change']"
    loading-auto
    @submit="onSubmit"
  >
    <template #description>
      Du hast bereits ein Konto? <ULink
        to="/auth/login"
        class="text-primary font-medium"
      >
        Anmelden
      </ULink>.
    </template>
  </UAuthForm>
</template>

<style></style>
