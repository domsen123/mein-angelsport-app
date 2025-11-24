import type { AppSession, AppUser } from '~~/server/utils/auth'
import { adminClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/vue'

export const useAuth = () => {
  const cookieString = useRequestHeader('cookie')
  const { url } = useSiteConfig()

  const authClient = createAuthClient({
    baseURL: url,
    fetchOptions: {
      credentials: 'include',
      headers: cookieString ? { cookie: cookieString } : undefined,
    },
    plugins: [
      adminClient(),
    ],
  })

  return authClient
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<AppSession | null>(null)
  const currentUser = ref<AppUser | null>(null)

  const getSession = async () => {
    const { data } = await useAuth().getSession()

    session.value = (data?.session || null) as AppSession | null
    currentUser.value = (data?.user || null) as AppUser | null
    return data
  }

  const signOut = async () => {
    await useAuth().signOut()
    session.value = null
    currentUser.value = null
  }

  return {
    session: readonly(session),
    currentUser: readonly(currentUser),
    getSession,
    signOut,
  }
})
