import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

import partytown from '@astrojs/partytown';

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  site: 'https://www.adamibnu.my.id',
  integrations: [tailwind(), sitemap(), partytown({
    config: {
      forward: ['dataLayer.push'],
    },
  })],
  styles: [
    '@fortawesome/fontawesome-free/css/all.min.css'
  ],
});
