import process from 'node:process'
import { ProxyAgent, setGlobalDispatcher } from 'undici'

const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY
if (proxyUrl) {
  const proxyAgent = new ProxyAgent(proxyUrl)
  setGlobalDispatcher(proxyAgent)
  console.info(`Proxy configured: ${proxyUrl}`)
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  typescript: { strict: true },
  modules: [
    '@vueuse/nuxt',
    '@nuxtjs/seo',
    '@nuxt/image',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    '@nuxtjs/mdc',
    '@nuxt/test-utils/module',
    'nuxt-mcp-dev',
  ],
  css: ['~/assets/css/main.css'],
  nitro: {
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      // Run expired reservations cleanup every minute
      '* * * * *': ['shop:cleanup-reservations'],
    },
  },
})
