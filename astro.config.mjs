// @ts-check
import { defineConfig } from 'astro/config'
import icon from 'astro-icon'
import sitemap from '@astrojs/sitemap'
import svelte from '@astrojs/svelte'
import vercel from '@astrojs/vercel'
import cloudflare from '@astrojs/cloudflare'

const isCloudflare = process.env.DEPLOY_TARGET === 'cloudflare'
const adapter = isCloudflare ? cloudflare() : vercel()

export default defineConfig({
  site: 'https://academiajuvenil.progcomp.cl',
  output: 'server',
  adapter: adapter,
  integrations: [sitemap(), icon(), svelte()],
})
