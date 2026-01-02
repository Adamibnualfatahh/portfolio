import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  site: 'https://www.adamibnu.dev',
  integrations: [tailwind(), sitemap()],
  styles: [
    '@fortawesome/fontawesome-free/css/all.min.css'
  ],
});