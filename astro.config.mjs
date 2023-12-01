import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: 'https://adamibnu.com',
  integrations: [tailwind(), sitemap(), ],
  styles: [
    '@fortawesome/fontawesome-free/css/all.min.css'
    ],
});