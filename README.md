# Adam Ibnu Alfatah

Requires Node.js 22.12 or newer. Built as static HTML with Astro 7, Tailwind CSS 3 through PostCSS, and an XML sitemap. Vercel serves `dist/` with the security and caching headers in `vercel.json`.

Pages live in `src/pages/`, shared UI in `src/components/`, and article content in `src/content/blog/`. The content schema and loader are defined in `src/content.config.ts`. Images in `src/assets/` are optimized at build time; `public/` contains assets copied directly into the build.

## Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `npm install`          | Installs dependencies                            |
| `npm run dev`          | Starts local dev server at `localhost:4321`       |
| `npm run build`        | Build your production site to `./dist/`          |
| `npm run check`        | Check Astro and TypeScript                      |
| `npm test`             | Test the production build across three browsers |
| `npm run preview`      | Preview your build locally, before deploying     |
| `npm run astro ...`    | Run CLI commands like `astro add`, `astro check` |
| `npm run astro --help` | Get help using the Astro CLI                     |

## Responsive regression checks

```sh
npm install
npx playwright install chromium firefox webkit
npm run build
npm run check
npm test
```

Checks all 15 pages at 12 widths (320–1920 px) in Chromium, Firefox, and WebKit, plus touch and keyboard navigation, landscape, JavaScript fallback, blog filtering, code copying, audio controls, reduced motion, missing assets, and CSP errors. Third-party services are stubbed so these checks stay deterministic. Screenshots are written to `test-results/`.

To preview the production build with its security headers:

```sh
node scripts/test-responsive.mjs --serve
```

Open `https://127.0.0.1:4323` and accept the temporary local test certificate. The test server uses OpenSSL to generate this certificate and reproduces HTTPS, gzip compression, caching headers, and the production security policy. Vercel-specific analytics are enabled when building on Vercel (`VERCEL=1`).

# Adam Ibnu Alfatah — Portfolio

Personal portfolio and blog of Adam Ibnu Alfatah, a backend engineer working with Go, Laravel, and Node.js.
https://www.adamibnu.my.id