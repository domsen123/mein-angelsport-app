<script lang="ts" setup>
import type { FormSubmitEvent } from '#ui/types'
import type { CalendarDate } from '@internationalized/date'
import { z } from 'zod'

definePageMeta({
  layout: 'auth',
})

useSeoMeta({
  title: 'Mitgliedschaft bestätigen',
  description: 'Verknüpfen Sie Ihre Vereinsmitgliedschaft mit Ihrem Konto',
})

const clubSlug = useRouteQuery<string | undefined>('club')
const validationToken = useRouteQuery<string | undefined>('token')

// Redirect if no club slug
if (!clubSlug.value) {
  await navigateTo('/auth/login')
}

const isStep2 = computed(() => !!validationToken.value)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

// Step 1: Identity verification
const step1Schema = z.object({
  firstName: z.string().min(1, 'Vorname ist erforderlich'),
  lastName: z.string().min(1, 'Nachname ist erforderlich'),
})

type Step1Schema = z.output<typeof step1Schema>

const step1State = reactive({
  firstName: '',
  lastName: '',
})

const birthday = ref<CalendarDate>()

const onStep1Submit = async (_event: FormSubmitEvent<Step1Schema>) => {
  if (!clubSlug.value || !birthday.value) {
    errorMessage.value = 'Bitte alle Felder ausfüllen'
    return
  }

  isLoading.value = true
  errorMessage.value = null

  try {
    const birthdateString = `${birthday.value.year}-${String(birthday.value.month).padStart(2, '0')}-${String(birthday.value.day).padStart(2, '0')}`

    const response = await $fetch('/api/auth/validate/verify', {
      method: 'POST',
      body: {
        clubSlug: clubSlug.value,
        firstName: step1State.firstName,
        lastName: step1State.lastName,
        birthdate: birthdateString,
      },
    })

    if (response.success && response.token) {
      await navigateTo({
        path: '/auth/validate',
        query: {
          club: clubSlug.value,
          token: response.token,
        },
      })
    }
  }
  catch (error: any) {
    errorMessage.value = error.data?.message || 'Ein Fehler ist aufgetreten'
  }
  finally {
    isLoading.value = false
  }
}

// Step 2: Login/Register
const step2Schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben'),
})

type Step2Schema = z.output<typeof step2Schema>

const step2State = reactive({
  email: '',
  password: '',
})

const onStep2Submit = async (_event: FormSubmitEvent<Step2Schema>) => {
  if (!clubSlug.value || !validationToken.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = null

  try {
    const response = await $fetch('/api/auth/validate/complete', {
      method: 'POST',
      body: {
        clubSlug: clubSlug.value,
        token: validationToken.value,
        email: step2State.email,
        password: step2State.password,
      },
    })

    if (response.success) {
      // Refresh auth state
      await useAuth().signIn.email({
        email: step2State.email,
        password: step2State.password,
      })
      await navigateTo(`/verein/${response.clubSlug}`)
    }
  }
  catch (error: any) {
    errorMessage.value = error.data?.message || 'Ein Fehler ist aufgetreten'
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Step 1: Identity verification -->
    <template v-if="!isStep2">
      <div class="text-center">
        <UIcon name="i-lucide-user-check" class="size-12 text-primary mb-4" />
        <h1 class="text-2xl font-bold">
          Mitgliedschaft bestätigen
        </h1>
        <p class="text-muted mt-2">
          Bitte geben Sie Ihre persönlichen Daten ein, um Ihre Vereinsmitgliedschaft zu verifizieren.
        </p>
      </div>

      <UAlert
        v-if="errorMessage"
        color="error"
        icon="i-lucide-alert-circle"
        :title="errorMessage"
      />

      <UForm :schema="step1Schema" :state="step1State" class="flex flex-col gap-4" @submit="onStep1Submit">
        <UFormField label="Vorname" name="firstName" required>
          <UInput v-model="step1State.firstName" class="w-full" placeholder="Max" />
        </UFormField>

        <UFormField label="Nachname" name="lastName" required>
          <UInput v-model="step1State.lastName" class="w-full" placeholder="Mustermann" />
        </UFormField>

        <UFormField label="Geburtsdatum" name="birthday" required>
          <UInputDate v-model="birthday" class="w-full" />
        </UFormField>

        <UButton type="submit" block :loading="isLoading">
          Mitgliedschaft prüfen
        </UButton>
      </UForm>

      <p class="text-center text-sm text-muted">
        Bereits ein Konto?
        <NuxtLink to="/auth/login" class="text-primary hover:underline">
          Anmelden
        </NuxtLink>
      </p>
    </template>

    <!-- Step 2: Login/Register -->
    <template v-else>
      <div class="text-center">
        <UIcon name="i-lucide-check-circle" class="size-12 text-success mb-4" />
        <h1 class="text-2xl font-bold">
          Mitglied gefunden!
        </h1>
        <p class="text-muted mt-2">
          Registrieren Sie sich oder melden Sie sich an, um Ihr Konto mit der Mitgliedschaft zu verknüpfen.
        </p>
      </div>

      <UAlert
        v-if="errorMessage"
        color="error"
        icon="i-lucide-alert-circle"
        :title="errorMessage"
      />

      <UForm :schema="step2Schema" :state="step2State" class="flex flex-col gap-4" @submit="onStep2Submit">
        <UFormField label="E-Mail" name="email" required>
          <UInput v-model="step2State.email" type="email" class="w-full" placeholder="max@example.com" />
        </UFormField>

        <UFormField label="Passwort" name="password" required>
          <UInput v-model="step2State.password" type="password" class="w-full" placeholder="••••••••" />
        </UFormField>

        <UButton type="submit" block :loading="isLoading">
          Konto erstellen / Anmelden
        </UButton>
      </UForm>

      <p class="text-center text-sm text-muted">
        Falls Sie bereits ein Konto haben, werden Sie automatisch angemeldet.
      </p>
    </template>
  </div>
</template>
