# Project memory: Pure Conscious Healing + Pure Crystal Hub

Read this first. It carries the context from the original build session (October 2026) so work can continue on any machine.

@AGENTS.md

## The client and the goal
- **Client:** Priyanka B. Chamoli, founder of **Pure Conscious Healing** (Lucknow, India). Clinical hypnotherapist, MBA from IBS Gurgaon. Trainer **Sarika Bhatnagar** teaches the Clinical Hypnotherapy Level 1 course.
- **Two brands, two domains, one codebase:**
  - `pureconscioushealing.com`: healing services, online booking, courses
  - `purecrystalhub.com`: crystal e-commerce
- **Brief:** a premium, immersive 3D, smooth-scrolling site with healing themes, working well on mobile, tablet and laptop. A full backend, plus an Admin Panel showing all changes. Built locally first, then hosted on a VPS.
- **Project owner (developer side):** Priyanshu. The user prefers **no-code-friendly** workflows, where the admin panel and Excel imports replace code edits.
- The original live sites could not be reached from the build sandbox, so **all products, prices and testimonials are placeholders**, labelled "Sample". Real data arrives through the Excel template and the admin.

## Decisions made with the client (see docs/01-discovery-content-inventory.md)
| Topic | Decision |
|---|---|
| Product data | Client fills `templates/PCH_Import_Template.xlsx` (Products / Services / Marketing Spend tabs) |
| Service prices | Placeholders for now, edited later in the admin |
| Services | Clinical Hypnotherapy, Chakra Balancing, Energy Alignment, Emotional Healing, **Past Life Regression**, **Prenatal & New-Mother Support** |
| Courses | Course pages with an **enquiry form** (no online course payment) |
| Trainers | "Our Trainers" section |
| Booking | Calendar slots plus **online payment** |
| Payments | **Razorpay** (UPI, cards, netbanking), **COD** (shop), **WhatsApp order** (shop). No Stripe. **India-only** shipping. |
| Shop extras | Coupons, GST invoices, customer accounts, reviews (moderated) |
| Healing → shop link | 3D crystal showcase of featured products, each linking to the product on Crystal Hub, plus a "Visit Pure Crystal Hub" button |
| Admin | Owner plus staff roles. Dashboard, audit log, analytics, content editor, **marketing spend** (manual + Excel), add products singly (with images and video) **or** by Excel upload |
| Alerts | Email + WhatsApp + in-admin bell |
| Branding | Keep the existing logos, refresh colours and fonts. PCH: lavender, warm sand, sage, gold. Crystal Hub: deep amethyst, crystal white, rose quartz. |
| 3D level | **Full immersive 3D** on both sites (quality adapts to the device) |
| Languages | **English + Hindi** (cookie `lang`, plus `_en`/`_hi` DB fields) |
| Stack | Next.js 16 + React Three Fiber/drei + GSAP/Lenis + Node (route handlers and server actions) + PostgreSQL + Drizzle ORM |
| Hosting | VPS (Hostinger/DigitalOcean): Docker Compose + Nginx |
| Git | Work on branch `build/v1`; PR #1 goes into `master` |

## How it works (architecture)
- **One Next.js app serves both domains.** `src/proxy.ts` (Next 16's name for middleware) rewrites by Host header: shop hosts go to `/shop/*`, everything else to `/healing/*`. `/admin` is shared. Locally, `localhost:3005` is healing and `shop.localhost:3005` is the shop.
- Site URLs come from runtime env `HEALING_URL` / `SHOP_URL`, deliberately **not** `NEXT_PUBLIC_*`, which would be inlined at build time.
- **Cache Components is OFF** (`next.config.ts`). Every page renders per request, so admin edits show instantly.
- **DB:** `src/db/schema.ts` (Drizzle), migrations in `/drizzle`. Seed: `scripts/seed.ts`, which accepts `--demo` for fake orders, bookings and analytics, and `--if-empty` to skip when staff already exist.
- **Auth:** JWT cookies via jose (`pch_staff`, `pch_customer`). `requireStaff(permission)` is called at the top of every admin page and action. Roles live in `src/lib/permissions.ts`.
- **Audit:** every admin mutation calls `audit()` (`src/lib/audit.ts`), which stores only the changed fields.
- **Payments:** `src/lib/payments.ts`. Without Razorpay keys there is a simulated checkout, allowed only in dev or when `ALLOW_TEST_PAYMENTS=1`. Signature verification happens server-side, plus a webhook.
- **Pricing:** GST-inclusive. `src/lib/pricing.ts` handles coupons, free shipping above a threshold, and the COD fee. The invoice PDF (`src/lib/invoice.ts`, pdfkit) uses CGST+SGST within the seller's state and IGST otherwise.
- **Booking slots:** `src/lib/slots.ts` works in fixed IST (+05:30) from weekly availability, blocked dates and existing bookings, with an unpaid hold time.
- **Notifications:** `src/lib/notify.ts` uses SMTP or a WhatsApp provider (interakt/gupshup/meta). If none is configured, messages are *logged* to Admin › Notifications.
- **Editable content:** `src/lib/content-registry.ts` lists every text, image and video slot with EN/HI defaults. Admin › Content editor saves to `content_blocks`.
- **Media:** uploads go to `storage/uploads` (Docker volume) and are served by `/media/[...path]` with HTTP Range support for scroll-scrubbed video.
- **3D:**
  - `src/components/three/HealingScene.tsx`: one fixed canvas. Sections tagged `data-scene="hero|intro|services|chakra|space|founder|learn|testimonials|crystals|cta|page"` blend "looks" by scroll weight (`HealingBackdrop.tsx`). The chakra column follows `[data-chakra-step]`.
  - `ShopScenes.tsx`: shop hero cluster and the product viewer (shape by category, colour from `src/lib/crystal-colors.ts`).
  - Quality tiers live in `quality.ts`. Reduced motion is respected.
- **Placeholder imagery:** `src/components/common/CrystalArt.tsx` draws faceted SVG crystals when a product has no photo.
- **Admin charts:** `src/components/admin/charts.tsx`, using the validated dataviz palette (blue/orange/aqua) with a table toggle and direct labels. Format props are *names* (`"inr"`, `"number"`…), never functions, because of the server→client boundary.

## Running it
- **Docker (preview):** `docker compose up -d --build`. Compose project `pure-conscious-healing`, port **3005**, separate from the user's other app "Indigram". Its own Postgres has no published port. The first start migrates and seeds; later starts keep data.
- **Node dev:** see README › Option B (`npm run dev` on port 3005).
- **VPS:** `docker compose --env-file .env -f deploy/compose.prod.yaml up -d --build` plus `deploy/nginx.conf`.
- Admin: `owner@pch.local` / `ChangeMe@123`. Demo Shop Manager: `shop@pch.local`.

## Conventions
- Next.js 16 differs from older versions. Read `node_modules/next/dist/docs/` before using unfamiliar APIs. Params and searchParams are Promises; use `proxy.ts`, not middleware.
- Tailwind v4 with tokens in `src/app/globals.css` (`@theme`). Custom classes (`.btn`, `.field`) sit in `@layer components` so utilities can override them.
- Fonts: Cormorant Garamond (healing display), Marcellus (shop display), Manrope (body), Mukta / Tiro Devanagari (Hindi).
- Run `npx tsc --noEmit` and `npx eslint src` before committing. ESLint allows `<img>` (uploaded media) and R3F mutation inside `components/three/`.
- Never disable TLS verification. Never commit `.env`.

## Status (end of build session)
✅ Healing site, shop, admin panel, Docker setup, README, deployment files. PR #1 is open on GitHub (`build/v1` → `master`).
Verified: typecheck, lint, production build; Playwright journeys (mobile booking with simulated payment, mobile COD checkout); admin flows (Excel import, edits, audit, role restriction); media upload and Range; Docker stack restart keeps data.

## Waiting on the client
- Filled Excel template plus product photos and videos
- Logos for both brands (SVG/PNG)
- Healing-space walkthrough video. Encode for scroll scrubbing: `ffmpeg -i in.mov -vf scale=1920:-2 -c:v libx264 -crf 24 -g 6 -keyint_min 6 -movflags +faststart -an out.mp4`
- Founder portrait, trainer photos, real testimonials
- Real service and course prices, course dates and syllabus
- Phone, WhatsApp number, studio address, social links, GSTIN and business address
- Razorpay keys, SMTP details, WhatsApp provider choice
- Review the placeholder policy pages (`src/lib/policies.ts`); Razorpay needs them before activation

## Ideas and next steps
- Place real media and tune the 3D colours to the final brand palette
- Merge PR #1, then deploy to the VPS with HTTPS
- Optional later: re-enable Next.js Cache Components with `"use cache"` on public queries for speed; add sitemap.xml and robots; add Google/Meta ad-API spend import
