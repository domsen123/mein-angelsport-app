export default defineNuxtRouteMiddleware(async () => {
  await useAuthStore().getSession()
})
