export default defineNuxtPlugin(async () => {
  await useAuthStore().getSession()
  const cookieString = useRequestHeader('cookie')

  const api = $fetch.create({
    credentials: 'include',
    onRequest({ options }) {
      const headers = options.headers as Headers

      if (cookieString) {
        headers.set('cookie', cookieString)
      }
    },
    onResponse({ response }) {
      return response.ok ? response._data : Promise.reject(response._data)
    },

    ignoreResponseError: true,
  })

  return {
    provide: { api },
  }
})
