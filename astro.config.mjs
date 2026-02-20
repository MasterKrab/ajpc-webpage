// @ts-check
import { defineConfig } from 'astro/config'
import icon from 'astro-icon'
import sitemap from '@astrojs/sitemap'
import svelte from '@astrojs/svelte'
import vercel from '@astrojs/vercel'

export default defineConfig({
  site: 'https://academiajuvenil.progcomp.cl',
  output: 'server',
  adapter: vercel(),
  integrations: [sitemap(), icon(), svelte()],
})
