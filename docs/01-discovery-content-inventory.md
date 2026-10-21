# Discovery: Content Inventory and Open Questions

Status: **Draft v0.1** (2026-10-20). Nothing has been designed or built yet. This file is the brief we build from.

---

## 1. How this inventory was gathered (and what's missing)

| Source | Result |
|---|---|
| Direct download of `pureconscioushealing.com` | ❌ Blocked by the cloud sandbox's network policy (proxy 403) |
| Web fetcher on `pureconscioushealing.com` | ❌ "Domain not found" (DNS) |
| Search-engine index of `pureconscioushealing.com` | ✅ 5 pages indexed (summaries only) |
| Anything on `purecrystalhub.com` | ❌ **Zero results.** Not reachable and not in any search index |

**So the lists below are partial.** Prices, durations and the full product catalogue could not be read. See §5 for how we can close that gap.

---

## 2. Pure Conscious Healing (PCH): what we know

### 2.1 Brand
- **Business:** holistic healing practice based in India (+91 phone numbers, Lucknow events)
- **Founder:** **Priyanka B. Chamoli**, certified clinical hypnotherapist and motivational speaker. MBA from IBS Gurgaon.
  - Origin story: overcame a long-standing breathing problem through hypnotherapy, which started her path into healing.
  - Earlier focus: expecting mothers and new mothers.
- **Email:** pureconscioushealing@gmail.com
- **Phone:** listed on the site but not captured. ❓ Needed.
- **Hours:** Mon–Sat, 10:00 am – 7:00 pm
- **Modes:** on-site (in person) and online sessions
- **Footer:** © 2025

### 2.2 Known pages (current site map)
| Page | URL | Content (from index) |
|---|---|---|
| Home | `/` | Hero, services overview, 1 testimonial (insomnia and overthinking), contact |
| Meet the Founder | `/meet-the-founder` | Priyanka's bio and story |
| Webinars & Workshops | `/webinars-workshops` | Event listings |
| Learning Holistic Health | `/learning-holistic-health` | Training / certification programmes |
| Course Details | `/course-details` | EKAA Clinical Hypnotherapy course detail |

### 2.3 Services (healing sessions)
| # | Service | Description (from site) | Duration | Price | Mode | Media needed |
|---|---|---|---|---|---|---|
| S1 | **Clinical Hypnotherapy** | For anxiety, stress, trauma, insomnia, overthinking, habits | ❓ | ❓ | On-site / Online | Session-room photo or video |
| S2 | **Chakra Balancing** | Energy-centre alignment | ❓ | ❓ | On-site / Online | Chakra visual |
| S3 | **Energy Alignment** | Energy healing work | ❓ | ❓ | ❓ | |
| S4 | **Emotional Healing** | Releasing emotional blocks and trauma | ❓ | ❓ | ❓ | |
| S5 | Prenatal / new-mother support (?) | Mentioned in founder bio. ❓ Still offered? | ❓ | ❓ | ❓ | |
| S6 | Past Life Regression (?) | Common with EKAA training. ❓ Offered? | ❓ | ❓ | ❓ | |

### 2.4 Training and education
| # | Programme | Details found | Price |
|---|---|---|---|
| T1 | **Clinical Hypnotherapy Level 1 Certification** | Includes chakra balancing and energy alignment skills. Last listed batch: **12–13 Apr 2025**, 09:00–18:00, Lucknow (on-site). Speaker: **Mrs. Sarika Bhatnagar** | ❓ |
| T2 | **EKAA Clinical Hypnotherapy Course** | 2 days. Topics include history of hypnosis and dream interpretation | ❓ |
| T3 | **Webinars & Workshops** | Past webinars listed (titles not captured) | ❓ |

### 2.5 Social proof
- 1 testimonial: client reports better sleep and calm after insomnia and overthinking. Full text and name ❓.

---

## 3. Pure Crystal Hub (PCrH): what we know

**Nothing could be retrieved.** The domain doesn't resolve from here and no search engine has indexed it. It may be new, unpublished, built on a platform that blocks crawlers, or spelled differently.

Template for the product catalogue (one row per product, to be filled in):

| SKU | Product name | Category | Crystal(s) | Size / weight / bead mm | Price (₹) | Sale price | Stock | Healing properties / chakra | Zodiac | Images | Video |
|---|---|---|---|---|---|---|---|---|---|---|---|
| | | Bracelet / Tumble / Raw / Tower / Pyramid / Tree / Mala / Pendant / Cluster / Sphere / Kit | | | | | | | | | |

---

## 4. Proposed site architecture (for discussion, not final)

**Two sites, one backend and one admin panel.**

```
pureconscioushealing.com  (healing, cinematic scroll)
  Hero video → Founder story → Services → Healing space (scroll-scrubbed video)
  → Trainings and events → Testimonials → Crystal teaser + "Explore Pure Crystal Hub" CTA
  → Book a session → Contact

purecrystalhub.com  (shop)
  Hero with a rotating 3D crystal → Collections → Product grid and filters → Product page
  (gallery, video, properties) → Cart → Checkout → Order tracking → Back to PCH

Admin panel (shared)
  Dashboard · Services · Events/Courses · Bookings · Products · Inventory · Orders
  · Customers · Testimonials · Media library · Enquiries · Site content · Audit log
  ("who changed what, when")
```

Proposed stack (open to change): Next.js + React Three Fiber / GSAP ScrollTrigger + Lenis smooth scroll · Node API · PostgreSQL (SQLite for local dev) · Prisma · local media storage (S3/Cloudinary later). Mobile, tablet and laptop responsive, with reduced-motion and low-power fallbacks for the 3D.

---

## 5. Decisions (client answers, 2026-10-21)

| # | Topic | Decision |
|---|---|---|
| 1 | Product data | Client sends a **spreadsheet**, using `templates/PCH_Import_Template.xlsx` |
| 2 | Service prices | **Placeholders for now**, editable later in admin |
| 3 | Extra services | Add **Past Life Regression** and **Prenatal / New-Mother Support** (6 services total) |
| 4 | Courses | Course pages with an **enquiry form** (no online course payment) |
| 5 | Trainers | **"Our Trainers"** section: Priyanka B. Chamoli, Sarika Bhatnagar, more added from admin |
| 6 | Session booking | **Calendar slots + online payment** with email confirmation. Admin sets availability |
| 7 | Payments | **Razorpay** (UPI, cards, netbanking), **Cash on Delivery** (shop), **WhatsApp order** (shop). No Stripe |
| 8 | Shipping | **India only** |
| 9 | Shop extras | Coupon codes, GST PDF invoices, customer accounts (orders, addresses, wishlist), product reviews (moderated) |
| 10 | PCH → Crystal Hub | **Cinematic 3D crystal showcase** of featured products. Each links to its product on purecrystalhub.com, plus a "Visit Pure Crystal Hub" CTA |
| 11 | Admin users | **Owner plus staff roles** (e.g. Shop Manager, Bookings Manager, Content Editor) |
| 12 | Admin features | Business dashboard · activity/audit log (before/after) · analytics · content editor for both sites · **marketing spend tracking** · **add product** one at a time (with image and video upload) **or bulk Excel import** |
| A | Marketing spend | **Manual entry + Excel upload**, with spend-vs-revenue (ROI) per channel and brand |
| 13 | Alerts | **Email** (owner and customer) · **WhatsApp** (Business API provider needed, TBD) · **in-admin notifications** |
| 14 | Branding | **Keep existing logos**, refresh colours and fonts (logo files still needed) |
| 15 | Palette | **PCH:** lavender, warm sand, sage, gold. **Crystal Hub:** deep amethyst, crystal white, rose quartz |
| 16 | 3D | **Full immersive 3D (WebGL) on both sites.** Adaptive quality plus `prefers-reduced-motion` fallback to keep phones usable |
| 17 | Languages | **English + Hindi**, with a language switcher. Admin content fields in both |
| 18 | Stack | **Next.js + Three.js (React Three Fiber) + GSAP/Lenis + Node API + PostgreSQL** (SQLite locally), Prisma |
| 19 | Hosting | **VPS** (Hostinger/DigitalOcean): Docker Compose, Nginx, PM2/Node, Postgres, local media storage |
| 20 | Git | Work on branch **`build/v1`** and open a PR into `master` |
| B | Import template | Provided: `templates/PCH_Import_Template.xlsx` (Products, Services, Marketing Spend tabs) |

### Still needed from client
- Filled import template (products), plus photos and videos
- Logo files (both brands, SVG/PNG preferred)
- Phone/WhatsApp number, studio address, social handles
- Testimonials (text, name, photo if allowed)
- GSTIN and business address (for invoices)
- Razorpay account (test keys are fine for local), WhatsApp Business API provider choice
- Course dates and syllabus
