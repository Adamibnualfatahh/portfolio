import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  site: 'https://www.adamibnu.com',
  integrations: [tailwind(), sitemap(), ],
  styles: [
    '@fortawesome/fontawesome-free/css/all.min.css'
    ],
});