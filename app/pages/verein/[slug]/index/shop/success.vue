<script lang="ts" setup>
const { clubSlug } = useClub()
</script>

<template>
  <UPageBody>
    <div class="max-w-lg mx-auto text-center space-y-6 py-12">
      <!-- Success Icon -->
      <div class="flex justify-center">
        <div class="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <UIcon name="i-lucide-check" class="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <!-- Success Message -->
      <div class="space-y-2">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Bestellung erfolgreich!
        </h2>
        <p class="text-gray-600 dark:text-gray-300">
          Vielen Dank für Ihre Bestellung. Sie erhalten in Kürze eine Bestätigung per E-Mail.
        </p>
      </div>

      <!-- Info Cards -->
      <div class="space-y-4 text-left">
        <UCard>
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-mail" class="w-5 h-5 text-primary-500 mt-0.5" />
            <div>
              <p class="font-medium">
                E-Mail-Bestätigung
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Eine Bestellbestätigung wurde an Ihre E-Mail-Adresse gesendet.
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-file-text" class="w-5 h-5 text-primary-500 mt-0.5" />
            <div>
              <p class="font-medium">
                Rechnung
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Die Rechnung wird Ihnen separat zugestellt. Bitte überweisen Sie den Betrag innerhalb von 14 Tagen.
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-package" class="w-5 h-5 text-primary-500 mt-0.5" />
            <div>
              <p class="font-medium">
                Versand
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Nach Zahlungseingang werden Ihre Erlaubnisscheine an die angegebene Adresse versendet.
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <UButton
          variant="outline"
          :to="`/verein/${clubSlug}/shop`"
        >
          <template #leading>
            <UIcon name="i-lucide-shopping-cart" />
          </template>
          Weitere Bestellung
        </UButton>
        <UButton
          :to="`/verein/${clubSlug}`"
        >
          <template #leading>
            <UIcon name="i-lucide-home" />
          </template>
          Zur Vereinsseite
        </UButton>
      </div>
    </div>
  </UPageBody>
</template>
