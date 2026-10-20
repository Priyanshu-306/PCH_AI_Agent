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

## 5. Open questions
See the question list in the chat. Answers will be recorded here.
