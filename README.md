# Portfolio Template

A personal portfolio with a fixed profile rail, an animated contour background, a bento home screen, a 3D page carousel, and a separate app-style layout for phones. Every piece of content is a placeholder. You swap in your own.

Stack: Vite 6, React 19, TypeScript, plain CSS custom properties, Three.js, GSAP, Lenis, React Router 7, Phosphor icons, Poppins.

## What it looks like

Straight from this repo, placeholders and all.

**Desktop** - the profile rail, the contour background and the bento home.

![Desktop: profile rail on the left, headline, tools marquee and a bento grid of project, about, credential, services and testimonial cards](docs/screenshots/desktop.png)

**Phone** - an app-style layout: a floating tab bar, a glance widget for your stats, app-icon tools and swipeable shelf cards. Light and dark.

<p>
  <img src="docs/screenshots/mobile-light.png" alt="Phone, light theme: profile header, one-line headline, stats widget, tools row and explore cards above a floating tab bar" width="300">
  &nbsp;&nbsp;
  <img src="docs/screenshots/mobile-dark.png" alt="Phone, dark theme: the same Home screen on a navy background" width="300">
</p>

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to dist/
npm run lint       # ESLint with the TypeScript parser and the React hooks rules
```

## Make it yours

Every spot that needs your content says **PLACEHOLDER** and describes what goes there. You can edit the files yourself, or open the repo in an AI coding tool and tell it what to put in each spot.

| What | Where |
|---|---|
| Name, handle, photo, email, socials, Home headline, phone stats and their icons | `src/data/profile.ts` (start here) |
| Phone headline size (holds your headline on one line) | `--headline-em` in `src/styles/mobile-pass.css` - the comment there shows how to measure it |
| Your photo | `public/avatar.svg` (or point `avatarSrc` at a `.webp`/`.png`) |
| Page headlines and copy | the top of each page component: `ProjectsGrid`, `ServicesGrid`, `ShowcaseGrid`, `TestimonialsGrid`, `AboutGrid`, `ContactGrid` in `src/components/` |
| Funnel pages and websites (the 3D carousel) | `src/data/funnels.ts` + HTML files in `public/funnels/` and `public/samples/` |
| Projects, apps, side builds | `src/data/projects.ts`, `src/data/ai-stack.ts` |
| FAQs | `src/data/faqs.ts` |
| Tools & Technologies | `src/data/tools.ts` (logos in `public/icons/`) |
| Testimonial videos | `public/testimonials/`, then set `src` in `TestimonialsGrid.tsx` |
| Contact form | `src/lib/contact.ts` (opens the visitor's email app by default; set `VITE_CONTACT_ENDPOINT` to post to your own backend) |
| SEO, share image, favicon | `index.html`, `public/favicon.svg` |
| Colors | `src/styles/tokens.css` |
| Privacy / Terms | `src/components/Privacy.tsx`, `src/components/ToS.tsx` |

### Layla assistant API

The Layla chat uses the Vercel serverless function at `api/layla.ts`. The
OpenAI key is read only by that server-side function; do not add it to a
`VITE_` variable or frontend code. If the key is absent or the AI service or
billing is unavailable, the chat reports the issue and uses its built-in demo
responses.

Before sending any request to OpenAI, the endpoint applies a shared per-IP
sliding-window limit using Upstash Redis. The defaults are 10 requests per 600
seconds; configure the limit with `LAYLA_RATE_LIMIT_REQUESTS` and
`LAYLA_RATE_LIMIT_WINDOW_SECONDS`. The endpoint hashes validated client IPs
before using them as rate-limit identifiers. It also checks same-origin browser
headers, caps the JSON body at 16 KB, accepts at most 12 alternating
user/assistant messages, and limits each message to 1,000 characters.

### Configure Upstash rate limiting

1. Create an account at [Upstash](https://console.upstash.com/) and create a
   Redis database. Select a region close to the Vercel function. Choose a plan
   that suits your expected usage and review Upstash's current pricing and
   quotas; this project does not create an account, database, or paid service
   automatically.
2. In the database details, copy the **REST URL** and **REST token**. Keep
   these credentials server-side. Never use a `VITE_` prefix or include them in
   frontend code.
3. Add the values to `.env.local` for local Vercel development and to the
   Vercel project's server-side environment variables for the environments you
   deploy:

```dotenv
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
LAYLA_RATE_LIMIT_REQUESTS=10
LAYLA_RATE_LIMIT_WINDOW_SECONDS=600
```

`LAYLA_RATE_LIMIT_REQUESTS` defaults to `10`; `LAYLA_RATE_LIMIT_WINDOW_SECONDS`
defaults to `600`. Both must be positive integers (maximums: 10,000 requests
and 86,400 seconds). The rate limiter uses Upstash's HTTP-based SDK, designed
for Vercel/serverless environments.

If `OPENAI_API_KEY` is absent, Layla continues to use its local demo responses
without requiring Redis. If the OpenAI key is configured but rate-limit
settings are missing/invalid or Upstash cannot be reached, the endpoint fails
closed with a service-unavailable response and does **not** make an OpenAI
request. The frontend then uses its demo response. The limiter has no
in-memory fail-open timeout; Redis availability is required before paid AI
requests can proceed.

Upstash is a third-party service with its own availability, quotas, and
potential costs. Monitor its usage and configure spending/usage controls in
Upstash and Vercel as appropriate. Same-origin checks are not authentication
and do not prevent non-browser clients from calling the public endpoint; keep
the shared rate limit and consider Vercel Firewall/WAF controls for additional
abuse protection.

For local development with the Vercel function enabled, add these values to
the git-ignored `.env.local` file:

```dotenv
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
LAYLA_RATE_LIMIT_REQUESTS=10
LAYLA_RATE_LIMIT_WINDOW_SECONDS=600
```

Run the app and function together using the Vercel CLI (`npx vercel dev`);
Vite's `npm run dev` alone serves the frontend but does not execute `api/`
functions. You can omit `OPENAI_API_KEY` and the Upstash variables to use demo
responses locally.

For deployment, add `OPENAI_API_KEY`, optionally `OPENAI_MODEL`, and the
Upstash variables under **Vercel Project Settings → Environment Variables**
for the environments you intend to use, then redeploy. The model defaults to
`gpt-4o-mini`. Configuring a valid key and active OpenAI billing enables paid
model requests when visitors send messages; the production build and this
setup do not make OpenAI requests or purchase credits.

### Adding your own funnels and websites

1. Put the page's HTML in `public/funnels/` (single pages, shown 16:9) or `public/samples/` (full websites, shown 3:4).
2. Add an entry to `src/data/funnels.ts`.
3. Run `node scripts/make-thumbs.mjs` to render the thumbnails. It uses the Playwright install that comes with the dev dependencies (run `npx playwright install chromium` once if needed).

To regenerate the placeholder pages: `node scripts/make-placeholder-sites.mjs`.

## Notes

- The background shader measures the visitor's frame rate and steps down on slow machines (`src/lib/perf.ts`). Keep any large `backdrop-filter` blur off the layers above it, because blur over an animated canvas is the most expensive thing on the page.
- From 1100px down, the site switches to the phone layout. `src/styles/mobile-app.css` owns its components (`TabBar`, `QuickMenu`, `HomeMobile`); `src/styles/mobile-pass.css` holds the motion (the tab pill, the bar hiding on scroll, page arrival, tile depth) and the native-feel fixes. Everything respects `prefers-reduced-motion` and the site's own Reduce motion switch.
- Anything new you add above the fold on Home must join the intro hold-back list in `src/styles/boot.css`. Otherwise it shows through the intro animation.

## Credits

- Contour background technique inspired by the landonorris.com site by OFF+BRAND. The simplex noise is Ashima Arts / Ian McEwan (MIT).
- Icons: [Phosphor](https://phosphoricons.com) (MIT). Tool logos in `public/icons/` are trademarks of their owners and are included as examples only.
- Font: Poppins (SIL Open Font License).

## License

[PolyForm Noncommercial 1.0.0](LICENSE), plus one extra permission: you can use it for **your own** portfolio, even if that portfolio promotes your paid services.

What it does not allow without a commercial license: selling or reselling this template, or building portfolio sites for other people for payment. For a commercial license, email brewedops@gmail.com.

Versions up to tag `v1.0.0-mit` (commit d3c05da) were MIT and stay MIT. Everything after that is under the license above.
