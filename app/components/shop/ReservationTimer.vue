<script lang="ts" setup>
const checkoutStore = useShopCheckoutStore()
const { clubSlug } = useClub()
const router = useRouter()
const toast = useToast()

// Calculate remaining time
const remainingSeconds = ref(0)

const updateRemainingTime = () => {
  const expiresAt = checkoutStore.reservationExpiresAt
  if (!expiresAt) {
    remainingSeconds.value = 0
    return
  }

  const now = new Date()
  const diff = expiresAt.getTime() - now.getTime()
  remainingSeconds.value = Math.max(0, Math.floor(diff / 1000))
}

// Update timer every second
let interval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  updateRemainingTime()
  interval = setInterval(updateRemainingTime, 1000)
})

onUnmounted(() => {
  if (interval) {
    clearInterval(interval)
  }
})

// Watch for expiration
watch(remainingSeconds, (value) => {
  if (value === 0 && checkoutStore.reservationExpiresAt) {
    // Reservation expired
    toast.add({
      title: 'Reservierung abgelaufen',
      description: 'Ihre Reservierung ist abgelaufen. Bitte wählen Sie die Erlaubnisscheine erneut aus.',
      color: 'warning',
    })
    checkoutStore.reset()
    router.push(`/verein/${clubSlug.value}/shop`)
  }
})

// Format time as MM:SS
const formattedTime = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Color based on time remaining
const timerColor = computed(() => {
  if (remainingSeconds.value <= 60)
    return 'error'
  if (remainingSeconds.value <= 120)
    return 'warning'
  return 'info'
})
</script>

<template>
  <UAlert
    v-if="checkoutStore.isReservationValid"
    :color="timerColor"
    icon="i-lucide-clock"
  >
    <template #title>
      Reservierung aktiv
    </template>
    <template #description>
      <span class="font-mono font-semibold">{{ formattedTime }}</span> verbleibend
    </template>
  </UAlert>
</template>
