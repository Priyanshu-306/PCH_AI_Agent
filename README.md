# Pure Conscious Healing · Pure Crystal Hub

Two immersive websites and one shared Admin Panel, built as a single Next.js application:

| Site | Local URL | Production domain |
|---|---|---|
| **Pure Conscious Healing**: healing services, booking, courses | http://localhost:3005 | pureconscioushealing.com |
| **Pure Crystal Hub**: crystal e-commerce | http://shop.localhost:3005 | purecrystalhub.com |
| **Admin Panel**: manages both | http://localhost:3005/admin | `/admin` on either domain |

All content is placeholder until the client's photos, videos, prices and product sheet arrive. Placeholder content is labelled as a sample wherever it appears.

---

## 1. Run it locally

### Option A — Docker (easiest; runs alongside your other Docker apps)

Requirements: Docker Desktop.

```bash
git clone https://github.com/Priyanshu-306/PCH_AI_Agent.git
cd PCH_AI_Agent
docker compose up -d --build
```

The first build takes a few minutes. When Docker Desktop shows **pure-conscious-healing** with `web` and `db` both green, open:

- http://localhost:3005: Pure Conscious Healing
- http://shop.localhost:3005: Pure Crystal Hub
- http://localhost:3005/admin: Admin (`owner@pch.local` / `ChangeMe@123`)

| Task | Command |
|---|---|
| Stop (keeps all data) | `docker compose stop` (or the ■ button in Docker Desktop) |
| Start again | `docker compose start` |
| Update after pulling new code | `git pull && docker compose up -d --build` |
| See logs | `docker compose logs -f web` |
| Use another port, e.g. 4000 | `APP_PORT=4000 docker compose up -d` (Windows PowerShell: `$env:APP_PORT=4000; docker compose up -d`) |

The first start creates the database and loads the sample content and demo dashboard data. Later starts keep everything you change in the admin. Data lives in the Docker volumes `pure-conscious-healing_pgdata` and `pure-conscious-healing_media`. The database is not exposed outside Docker, so it can't clash with other projects.

This preview uses the simulated Razorpay checkout and a local-only sign-in key. **Don't use `compose.yaml` on a live server**; see section 5.

### Option B — Node.js directly (for editing code)

Requirements: Node 22+, PostgreSQL 16.

```bash
npm install
cp .env.example .env            # then set AUTH_SECRET to a long random string
# create the database (once)
sudo -u postgres psql -c "CREATE USER pch WITH PASSWORD 'pch' CREATEDB;" -c "CREATE DATABASE pch OWNER pch;"
npm run db:migrate              # create tables
npm run db:seed                 # placeholder catalogue, services, content, settings
npm run db:seed:demo            # optional: demo orders/bookings/visits so dashboards have data
npm run dev
```

**No PostgreSQL installed?** Start just a database with Docker instead of the `CREATE USER` step above:

```bash
docker run --name pch-db -e POSTGRES_USER=pch -e POSTGRES_PASSWORD=pch -e POSTGRES_DB=pch -p 5432:5432 -d postgres:16.6
```

If port 5432 is already in use, use `-p 5433:5432` and change `DATABASE_URL` in `.env` to `…@localhost:5433/pch`.

**Port:** the site runs on **3005**, so it doesn't clash with other apps on 3000. To use another port, for example 4000:
1. In `.env`, set `HEALING_URL=http://localhost:4000` and `SHOP_URL=http://shop.localhost:4000`.
2. Run `npx next dev -p 4000`.

**Admin login:** `owner@pch.local` / `ChangeMe@123`. Change it in **Admin › Staff & roles**. A demo `shop@pch.local` account (Shop Manager role, same password) shows how roles restrict access.

`shop.localhost` resolves to your own machine in Chrome, Edge and Firefox. In Safari, add `127.0.0.1 shop.localhost` to `/etc/hosts`.

Other scripts: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run template` (regenerates the Excel import template).

---

## 2. What's inside

### Pure Conscious Healing
- **Full-screen WebGL scene** that follows the scroll. An iridescent aura orb, gold stardust and a background gradient blend between sections: dawn lavender, a night-sky chakra journey, the healing space, and twilight crystals.
- **Chakra journey**: seven 3D chakras light up in sync with the cards as you scroll.
- **Healing space**: a pinned, scroll-scrubbed video. It falls back to photos, or to a placeholder until media is uploaded.
- **Crystal showcase**: refractive 3D crystals plus featured products, each linking to its product page on Pure Crystal Hub, and a *Visit Pure Crystal Hub* button.
- 6 services, including Past Life Regression and Prenatal & New-Mother Support.
- **Online booking**: a calendar built from weekly hours, holidays and existing bookings, then payment by Razorpay, then confirmation by email and WhatsApp.
- Courses and webinars with batch dates and an enquiry form, an *Our Trainers* section, the founder story, contact page and policy pages.

### Pure Crystal Hub
- A 3D crystal-cluster hero, plus an interactive **3D preview on every product page**. The shape follows the category (bracelet, mala, tower, cluster, pyramid, tumble…) and the colour follows the crystal.
- Faceted SVG illustrations stand in for product photos until real ones are uploaded.
- Search and filters: category, intention, chakra, zodiac and price, with sorting.
- Cart, coupons and **GST-inclusive pricing**. Checkout by **Razorpay**, **cash on delivery** (COD) or **WhatsApp order**, India only.
- **GST tax invoice PDF**: CGST+SGST within the seller's state, IGST otherwise.
- Customer accounts (orders, addresses, wishlist), **moderated reviews** and order tracking.

### Admin Panel (`/admin`)
- **Dashboard**: revenue, visitors, marketing ROAS (return on ad spend), today's sessions, orders to ship, new enquiries, reviews to approve, low stock, revenue chart, recent activity.
- **Analytics**: built in, with no third-party trackers. Visitors, sources, devices, top pages, shop funnel, best sellers, sessions by service. Every chart has a table view.
- **Marketing spend**: enter it by hand or by Excel upload. ROAS is shown per brand.
- **Products**: add a single product with a photo gallery and video, **bulk Excel import** (matched by SKU) with a row-by-row error report, Excel export, quick stock edit, categories.
- **Orders**: status, tracking number, refunds and cancellations (stock returns automatically), customer email and WhatsApp updates, invoice.
- **Coupons**, **Reviews** (approve, reject or delete).
- **Services & courses**, with batch dates and Excel import. **Bookings** with private notes and meeting links. **Availability & holidays**, **Enquiries**, **Trainers**, **Testimonials**.
- **Content editor**: every headline, paragraph, photo and video on both sites, in **English and Hindi**.
- **Media library**: drag-and-drop uploads, images up to 15 MB and videos up to 300 MB.
- **Notifications**: an in-app alert bell, plus a log of every email and WhatsApp message.
- **Activity log**: who changed what and when, with before and after values for each field.
- **Staff & roles**: Owner, Shop Manager, Bookings Manager, Content Editor.
- **Settings**: contact details, shipping and COD, GST and business details, booking rules, and the status of each integration.

---

## 3. Swapping in the real content

1. **Photos and videos**: upload them in **Admin › Media library**.
2. **Products**: fill `templates/PCH_Import_Template.xlsx` (also downloadable from the admin import pages). Put photo file names in `image_files`, then upload it in **Products › Import Excel**. Re-importing updates existing products by SKU.
3. **Services and prices**: edit them in **Services & courses**, or use the *Services* tab of the same template.
4. **Text, logo, hero and healing-space videos, founder portrait**: **Content editor**.
5. **Phone, WhatsApp number, address, GSTIN**: **Settings**.

**Scroll-scrubbed video tip:** for smooth scrubbing, encode with frequent keyframes. Under ~10 MB is ideal:

```bash
ffmpeg -i studio.mov -vf "scale=1920:-2" -c:v libx264 -crf 24 -g 6 -keyint_min 6 -movflags +faststart -an studio-scroll.mp4
```

---

## 4. Going live (integrations)

All keys live in `.env` on the server, never in the database.

| Feature | Until configured | To enable |
|---|---|---|
| Razorpay (UPI, cards, netbanking) | Simulated test checkout in development. Hidden in production. | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and optionally `RAZORPAY_WEBHOOK_SECRET`. Webhook URL: `https://pureconscioushealing.com/api/payments/razorpay/webhook`, event `payment.captured`. |
| Email | Logged in Admin › Notifications | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `OWNER_EMAIL` |
| WhatsApp Business | Logged in Admin › Notifications | `WHATSAPP_PROVIDER` (`interakt`, `gupshup` or `meta`), `WHATSAPP_API_KEY`, `WHATSAPP_PHONE_ID`, `OWNER_WHATSAPP` |

Razorpay requires the policy pages to be live before it activates an account; they are at `/policies/*` on both sites. Review the placeholder wording with the client.

---

## 5. Deploying to a VPS (Hostinger / DigitalOcean)

**Docker** (recommended):

```bash
git clone … && cd PCH_AI_Agent
cp .env.example .env          # set AUTH_SECRET, POSTGRES_PASSWORD, HEALING_URL/SHOP_URL, hosts, keys
docker compose --env-file .env -f deploy/compose.prod.yaml up -d --build
docker compose --env-file .env -f deploy/compose.prod.yaml exec web npx tsx scripts/seed.ts --if-empty   # first deploy only
sudo cp deploy/nginx.conf /etc/nginx/sites-available/pch && sudo ln -s ../sites-available/pch /etc/nginx/sites-enabled/
sudo certbot --nginx -d pureconscioushealing.com -d www.pureconscioushealing.com -d purecrystalhub.com -d www.purecrystalhub.com
```

Production `.env` values to change: `HEALING_URL=https://pureconscioushealing.com`, `SHOP_URL=https://purecrystalhub.com`, and `SHOP_HOSTS` and `HEALING_HOSTS` with the real domains.

The two sites can also be hosted separately: run the same build on two servers, each pointing its own domain at it, sharing one database.

**Without Docker:** install Postgres, run `npm ci && npx next build && npx drizzle-kit migrate`, then `pm2 start deploy/ecosystem.config.cjs`.

**Backups:** `deploy/backup.sh` (database and media, keeps 30 days). Add it to cron.

---

## 6. Architecture

```
src/
  proxy.ts              host-based routing: domain → /healing/* or /shop/*; /admin guard
  app/healing/…         Pure Conscious Healing pages
  app/shop/…            Pure Crystal Hub pages
  app/admin/(panel)/…   Admin Panel (each page and action checks the staff role)
  app/api/…             bookings, orders, payments, cart quote, slots, invoices, media, analytics
  components/three/     WebGL scenes (react-three-fiber): orb, chakras, crystals, product viewer
  db/schema.ts          Drizzle ORM schema (PostgreSQL); migrations in /drizzle
  lib/                  auth, permissions, pricing/GST, slots, payments, notifications, Excel, invoice, stats
  i18n/                 English/Hindi UI strings (content fields carry their own _en/_hi values)
```

Key decisions:
- **One app, two domains.** This means one backend, one admin panel and one login, and the two sites can still be deployed separately.
- **Next.js 16 Cache Components is turned off.** Every page renders per request, so admin edits appear instantly. Turning it on later for speed is a contained change: add `"use cache"` to the public data functions.
- **3D quality adapts to the device.** Phones and low-core devices get fewer particles, lower DPR (device pixel ratio) and no bloom. The scene honours `prefers-reduced-motion`.
- **Analytics are first-party.** The site records page views and funnel events itself, with no third-party trackers. Visitors are identified only by a random cookie ID.
