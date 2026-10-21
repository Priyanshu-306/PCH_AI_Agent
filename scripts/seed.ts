/**
 * Seeds placeholder content. Safe to re-run: existing rows (matched by sku/code/key/email) are kept.
 *   npm run db:seed          → base content (staff, catalogue, services, content, settings)
 *   npm run db:seed -- --demo → also adds demo orders, bookings, analytics and marketing spend
 */
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { db } from "../src/db";
import * as s from "../src/db/schema";
import { CONTENT } from "../src/lib/content-registry";
import { SETTING_DEFAULTS } from "../src/lib/settings-defaults";
import { slugify } from "../src/lib/format";

const SAMPLE = "Sample product — replace via Admin › Products or Excel import.";

const CATEGORIES: [string, string][] = [
  ["Bracelet", "ब्रेसलेट"], ["Tumble", "टम्बल"], ["Raw Stone", "कच्चा पत्थर"], ["Tower / Point", "टावर / पॉइंट"],
  ["Pyramid", "पिरामिड"], ["Sphere", "गोला"], ["Cluster / Geode", "क्लस्टर / जियोड"], ["Tree", "क्रिस्टल ट्री"],
  ["Mala", "माला"], ["Pendant", "पेंडेंट"], ["Ring", "अंगूठी"], ["Angel / Carving", "एंजेल / नक्काशी"],
  ["Kit / Combo", "किट / कॉम्बो"], ["Other", "अन्य"],
];

type P = [sku: string, name: string, nameHi: string, cat: string, crystals: string, chakras: string, props: string, zodiac: string, size: string, mrp: number, sale: number | null, featured?: boolean];

const PRODUCTS: P[] = [
  ["PCH-BR-AME-08", "Amethyst Bracelet", "एमेथिस्ट ब्रेसलेट", "Bracelet", "Amethyst", "Third Eye, Crown", "Calm, Sleep, Intuition", "Pisces, Aquarius, Virgo", "8 mm beads", 1499, 1199, true],
  ["PCH-BR-RQZ-08", "Rose Quartz Bracelet", "रोज़ क्वार्ट्ज़ ब्रेसलेट", "Bracelet", "Rose Quartz", "Heart", "Love, Self-love, Emotional healing", "Taurus, Libra", "8 mm beads", 1299, 999, true],
  ["PCH-BR-CIT-08", "Citrine Bracelet", "सिट्रीन ब्रेसलेट", "Bracelet", "Citrine", "Solar Plexus, Sacral", "Abundance, Confidence, Joy", "Gemini, Leo, Aries", "8 mm beads", 1599, 1299, true],
  ["PCH-BR-TGE-08", "Tiger Eye Bracelet", "टाइगर आई ब्रेसलेट", "Bracelet", "Tiger Eye", "Solar Plexus, Sacral", "Courage, Focus, Protection", "Leo, Capricorn", "8 mm beads", 999, 799],
  ["PCH-BR-BTM-08", "Black Tourmaline Bracelet", "ब्लैक टूमलाइन ब्रेसलेट", "Bracelet", "Black Tourmaline", "Root", "Protection, Grounding", "Capricorn, Libra", "8 mm beads", 1199, 949],
  ["PCH-BR-7CH-08", "7 Chakra Balancing Bracelet", "7 चक्र संतुलन ब्रेसलेट", "Bracelet", "7 Chakra", "Root, Sacral, Solar Plexus, Heart, Throat, Third Eye, Crown", "Balance, Healing, Energy flow", "", "8 mm beads", 1099, 849, true],
  ["PCH-BR-PYR-08", "Pyrite Bracelet", "पाइराइट ब्रेसलेट", "Bracelet", "Pyrite", "Solar Plexus", "Wealth, Willpower, Success", "Leo, Aries", "8 mm beads", 1799, 1499],
  ["PCH-BR-GAV-08", "Green Aventurine Bracelet", "ग्रीन एवेंचुरीन ब्रेसलेट", "Bracelet", "Green Aventurine", "Heart", "Luck, Growth, Opportunity", "Virgo, Taurus", "8 mm beads", 999, null],
  ["PCH-BR-LAP-08", "Lapis Lazuli Bracelet", "लैपिस लाज़ुली ब्रेसलेट", "Bracelet", "Lapis Lazuli", "Throat, Third Eye", "Communication, Truth, Wisdom", "Sagittarius, Pisces", "8 mm beads", 1699, null],
  ["PCH-BR-MNS-08", "Moonstone Bracelet", "मूनस्टोन ब्रेसलेट", "Bracelet", "Moonstone", "Sacral, Crown", "Feminine energy, Fertility, Intuition", "Cancer, Libra", "8 mm beads", 1899, 1599, true],
  ["PCH-TW-CQZ-04", "Clear Quartz Tower", "क्लियर क्वार्ट्ज़ टावर", "Tower / Point", "Clear Quartz", "Crown", "Amplify, Clarity, Healing", "All signs", "3–4 inch", 1499, null],
  ["PCH-TW-AME-04", "Amethyst Tower", "एमेथिस्ट टावर", "Tower / Point", "Amethyst", "Third Eye, Crown", "Calm, Meditation, Protection", "Pisces, Aquarius", "3–4 inch", 1999, 1699],
  ["PCH-AN-RQZ-02", "Rose Quartz Angel", "रोज़ क्वार्ट्ज़ एंजेल", "Angel / Carving", "Rose Quartz", "Heart", "Love, Comfort, Gentleness", "Taurus, Libra", "2 inch", 899, null],
  ["PCH-OT-SEL-PL", "Selenite Charging Plate", "सेलेनाइट चार्जिंग प्लेट", "Other", "Selenite", "Crown", "Cleansing, Charging, Peace", "Taurus, Cancer", "4 inch round", 799, 649],
  ["PCH-CL-PYR-RW", "Raw Pyrite Cluster", "रॉ पाइराइट क्लस्टर", "Cluster / Geode", "Pyrite", "Solar Plexus", "Wealth, Abundance, Protection", "Leo", "150–200 g", 2499, 1999, true],
  ["PCH-CL-AME-GD", "Amethyst Geode Cluster", "एमेथिस्ट जियोड क्लस्टर", "Cluster / Geode", "Amethyst", "Third Eye, Crown", "Peace, Purification, Spiritual growth", "Pisces, Virgo", "300–400 g", 3499, 2999],
  ["PCH-TR-7CH-TL", "7 Chakra Tree of Life", "7 चक्र ट्री ऑफ़ लाइफ़", "Tree", "7 Chakra", "Root, Sacral, Solar Plexus, Heart, Throat, Third Eye, Crown", "Harmony, Growth, Positive energy", "", "8 inch", 1899, 1499, true],
  ["PCH-TM-7CH-ST", "Seven Chakra Tumble Set", "सात चक्र टम्बल सेट", "Tumble", "7 Chakra", "Root, Sacral, Solar Plexus, Heart, Throat, Third Eye, Crown", "Balance, Meditation", "", "7 stones", 699, 549],
  ["PCH-TM-RQZ-100", "Rose Quartz Tumbles (100 g)", "रोज़ क्वार्ट्ज़ टम्बल (100 ग्रा.)", "Tumble", "Rose Quartz", "Heart", "Love, Self-love", "Taurus, Libra", "100 g", 449, null],
  ["PCH-RW-BTM-01", "Raw Black Tourmaline", "रॉ ब्लैक टूमलाइन", "Raw Stone", "Black Tourmaline", "Root", "Protection, EMF shield, Grounding", "Capricorn", "50–80 g", 599, null],
  ["PCH-PY-CQZ-02", "Clear Quartz Pyramid", "क्लियर क्वार्ट्ज़ पिरामिड", "Pyramid", "Clear Quartz", "Crown", "Manifestation, Focus", "All signs", "2 inch base", 1299, null],
  ["PCH-PY-CIT-02", "Citrine Pyramid", "सिट्रीन पिरामिड", "Pyramid", "Citrine", "Solar Plexus", "Prosperity, Success", "Gemini, Leo", "2 inch base", 1499, 1299],
  ["PCH-ML-AME-108", "Amethyst Jaap Mala (108 beads)", "एमेथिस्ट जाप माला (108 मनके)", "Mala", "Amethyst", "Third Eye, Crown", "Meditation, Mantra practice, Calm", "Pisces, Aquarius", "8 mm, 108 beads", 1999, 1699],
  ["PCH-PD-RQZ-01", "Rose Quartz Pendant", "रोज़ क्वार्ट्ज़ पेंडेंट", "Pendant", "Rose Quartz", "Heart", "Love, Emotional balance", "Taurus, Libra", "1 inch with chain", 699, null],
  ["PCH-KT-MON-03", "Money Magnet Kit", "मनी मैग्नेट किट", "Kit / Combo", "Citrine, Pyrite, Green Aventurine", "Solar Plexus, Heart", "Wealth, Luck, Abundance", "", "3 stones + pouch", 2199, 1799, true],
  ["PCH-KT-SLP-03", "Sleep & Calm Kit", "स्लीप एंड काम किट", "Kit / Combo", "Amethyst, Lepidolite, Selenite", "Third Eye, Crown", "Sleep, Anxiety relief, Calm", "", "3 stones + pouch", 1999, 1599],
];

const DESC = (name: string, crystals: string, props: string) =>
  `${name} — natural ${crystals.toLowerCase()} chosen by our healers and energised before dispatch. Traditionally associated with ${props.toLowerCase()}. ${SAMPLE}`;

const TRAINERS = [
  {
    slug: "priyanka-b-chamoli",
    name: "Priyanka B. Chamoli",
    titleEn: "Founder · Certified Clinical Hypnotherapist · Motivational Speaker",
    titleHi: "संस्थापक · प्रमाणित क्लिनिकल हिप्नोथेरेपिस्ट · प्रेरक वक्ता",
    bioEn:
      "Priyanka discovered hypnotherapy while searching for relief from a long-standing breathing problem — and found her calling. An MBA from IBS Gurgaon, she now guides clients through anxiety, trauma, sleeplessness and life transitions, with special care for expecting and new mothers.",
    bioHi:
      "लंबे समय से चली आ रही साँस की समस्या से राहत खोजते हुए प्रियंका ने हिप्नोथेरेपी को जाना — और अपना जीवन-उद्देश्य पाया। IBS गुड़गाँव से MBA, वे आज चिंता, आघात, अनिद्रा और जीवन के बदलावों में लोगों का मार्गदर्शन करती हैं, विशेषकर गर्भवती और नई माताओं का।",
    credentials: "Certified Clinical Hypnotherapist, MBA (IBS Gurgaon)",
    isFounder: true,
    sort: 0,
  },
  {
    slug: "sarika-bhatnagar",
    name: "Sarika Bhatnagar",
    titleEn: "Trainer · Clinical Hypnotherapy",
    titleHi: "प्रशिक्षक · क्लिनिकल हिप्नोथेरेपी",
    bioEn: "Sarika leads the Clinical Hypnotherapy Level 1 certification. Placeholder bio — please update in Admin › Trainers.",
    bioHi: "सारिका क्लिनिकल हिप्नोथेरेपी लेवल 1 सर्टिफ़िकेशन का संचालन करती हैं। अस्थायी विवरण — कृपया एडमिन › ट्रेनर्स में अपडेट करें।",
    credentials: "Clinical Hypnotherapy Trainer",
    isFounder: false,
    sort: 1,
  },
];

type Svc = Omit<typeof s.services.$inferInsert, "slug"> & { trainerSlug?: string };
const SERVICES: Svc[] = [
  { code: "SRV-HYP", type: "session", nameEn: "Clinical Hypnotherapy", nameHi: "क्लिनिकल हिप्नोथेरेपी",
    shortEn: "Gentle, guided work with the subconscious mind to release anxiety, fears and old patterns.",
    shortHi: "चिंता, डर और पुराने पैटर्न को छोड़ने के लिए अवचेतन मन के साथ सौम्य, निर्देशित कार्य।",
    descriptionEn: "In a deeply relaxed yet aware state, the subconscious becomes open to new, healthier patterns. Clinical hypnotherapy can help with anxiety, phobias, stress, insomnia, overthinking, habits and confidence. Each session begins with a conversation about what you want to change, followed by a guided hypnosis and an integration discussion.",
    descriptionHi: "गहरी विश्रांति और सजगता की अवस्था में अवचेतन मन नए, स्वस्थ पैटर्न के लिए खुल जाता है। क्लिनिकल हिप्नोथेरेपी चिंता, फ़ोबिया, तनाव, अनिद्रा, अत्यधिक सोच, आदतों और आत्मविश्वास में सहायक हो सकती है।",
    helpsWith: "Anxiety, Stress, Trauma, Insomnia, Overthinking, Phobias, Habits", durationMinutes: 90, mode: "both", price: 3500, accent: "#9b7fd4", sort: 1, trainerSlug: "priyanka-b-chamoli" },
  { code: "SRV-CHK", type: "session", nameEn: "Chakra Balancing", nameHi: "चक्र संतुलन",
    shortEn: "Realign your seven energy centres for grounding, clarity and emotional ease.",
    shortHi: "स्थिरता, स्पष्टता और भावनात्मक सहजता के लिए अपने सात ऊर्जा केंद्रों को संतुलित करें।",
    descriptionEn: "A calming session that scans and gently restores the flow of energy through your seven chakras using breath, visualisation, sound and crystals.",
    descriptionHi: "एक शांत सेशन जिसमें श्वास, कल्पना, ध्वनि और क्रिस्टल की सहायता से आपके सात चक्रों में ऊर्जा का प्रवाह सौम्यता से पुनः स्थापित किया जाता है।",
    helpsWith: "Low energy, Emotional blocks, Restlessness, Lack of focus", durationMinutes: 60, mode: "both", price: 2500, accent: "#5fbf7a", sort: 2, trainerSlug: "priyanka-b-chamoli" },
  { code: "SRV-ENA", type: "session", nameEn: "Energy Alignment", nameHi: "ऊर्जा संतुलन",
    shortEn: "Clear stagnant energy and return to a natural, steady state of flow.",
    shortHi: "रुकी हुई ऊर्जा को साफ़ करें और प्रवाह की प्राकृतिक अवस्था में लौटें।",
    descriptionEn: "Energy alignment works with the subtle body to clear heaviness, restore vitality and help you feel like yourself again.",
    descriptionHi: "ऊर्जा संतुलन सूक्ष्म शरीर के साथ कार्य करता है — भारीपन दूर करने, जीवन शक्ति लौटाने और आपको फिर से स्वयं जैसा महसूस कराने के लिए।",
    helpsWith: "Fatigue, Heaviness, Burnout, Feeling stuck", durationMinutes: 60, mode: "both", price: 2500, accent: "#46a8e0", sort: 3, trainerSlug: "priyanka-b-chamoli" },
  { code: "SRV-EMO", type: "session", nameEn: "Emotional Healing", nameHi: "भावनात्मक हीलिंग",
    shortEn: "A safe space to process grief, hurt and trauma — and to feel lighter again.",
    shortHi: "दुःख, चोट और आघात से उबरने और फिर से हल्का महसूस करने का एक सुरक्षित स्थान।",
    descriptionEn: "Using hypnotherapy techniques and compassionate guidance, emotional healing helps you understand and release the feelings that keep you stuck.",
    descriptionHi: "हिप्नोथेरेपी तकनीकों और करुणामय मार्गदर्शन से भावनात्मक हीलिंग आपको उन भावनाओं को समझने और छोड़ने में मदद करती है जो आपको आगे बढ़ने से रोकती हैं।",
    helpsWith: "Grief, Trauma, Relationships, Anger, Low self-worth", durationMinutes: 75, mode: "both", price: 3000, accent: "#f2b8c8", sort: 4, trainerSlug: "priyanka-b-chamoli" },
  { code: "SRV-PLR", type: "session", nameEn: "Past Life Regression", nameHi: "पास्ट लाइफ़ रिग्रेशन",
    shortEn: "Explore memories beyond this lifetime to understand present-day patterns.",
    shortHi: "वर्तमान जीवन के पैटर्न को समझने के लिए इस जीवन से परे की स्मृतियों का अन्वेषण करें।",
    descriptionEn: "A guided regression in deep hypnosis that many clients find brings profound insight into recurring fears, relationships and life themes.",
    descriptionHi: "गहरी हिप्नोसिस में एक निर्देशित रिग्रेशन, जिससे कई क्लाइंट्स को बार-बार आने वाले डर, रिश्तों और जीवन के विषयों की गहरी समझ मिलती है।",
    helpsWith: "Unexplained fears, Recurring patterns, Relationships, Life purpose", durationMinutes: 120, mode: "both", price: 5000, accent: "#5a5fd6", sort: 5, trainerSlug: "priyanka-b-chamoli" },
  { code: "SRV-MOM", type: "session", nameEn: "Prenatal & New-Mother Support", nameHi: "गर्भावस्था और नई माँ सहयोग",
    shortEn: "Calm, confident pregnancy and gentle support through the fourth trimester.",
    shortHi: "शांत, आत्मविश्वासी गर्भावस्था और प्रसव के बाद के समय में सौम्य सहयोग।",
    descriptionEn: "Hypnotherapy and relaxation practices designed for expecting and new mothers — easing birth anxiety, improving sleep and supporting emotional wellbeing after delivery.",
    descriptionHi: "गर्भवती और नई माताओं के लिए बनाई गई हिप्नोथेरेपी और विश्रांति विधियाँ — प्रसव की चिंता कम करने, नींद सुधारने और प्रसव के बाद भावनात्मक स्वास्थ्य के लिए।",
    helpsWith: "Pregnancy anxiety, Birth preparation, Postpartum stress, Sleep", durationMinutes: 60, mode: "both", price: 2800, accent: "#f08a3c", sort: 6, trainerSlug: "priyanka-b-chamoli" },
  { code: "CRS-CH-L1", type: "course", nameEn: "Clinical Hypnotherapy Level 1 Certification", nameHi: "क्लिनिकल हिप्नोथेरेपी लेवल 1 सर्टिफ़िकेशन",
    shortEn: "Two-day certification including chakra balancing and energy alignment skills.",
    shortHi: "दो दिवसीय सर्टिफ़िकेशन, जिसमें चक्र संतुलन और ऊर्जा संतुलन कौशल शामिल हैं।",
    descriptionEn: "An experiential foundation in clinical hypnotherapy. You will learn how the conscious and subconscious mind work, induction and deepening techniques, safe practice, and how to integrate chakra balancing and energy alignment into sessions. Includes practice rounds and a certificate on completion.",
    descriptionHi: "क्लिनिकल हिप्नोथेरेपी की अनुभवात्मक नींव। आप सचेत और अवचेतन मन की कार्यप्रणाली, इंडक्शन और डीपनिंग तकनीकें, सुरक्षित अभ्यास और सेशन में चक्र व ऊर्जा संतुलन को जोड़ना सीखेंगे।",
    helpsWith: "Aspiring therapists, Coaches, Wellness practitioners, Personal growth", durationMinutes: 1080, mode: "onsite", price: null, bookableOnline: false, accent: "#c9a227", sort: 10, trainerSlug: "sarika-bhatnagar" },
  { code: "CRS-EKAA", type: "course", nameEn: "EKAA Clinical Hypnotherapy Course", nameHi: "EKAA क्लिनिकल हिप्नोथेरेपी कोर्स",
    shortEn: "A 2-day EKAA programme covering the history of hypnosis, dream interpretation and more.",
    shortHi: "हिप्नोसिस का इतिहास, स्वप्न विश्लेषण और बहुत कुछ — 2 दिवसीय EKAA कार्यक्रम।",
    descriptionEn: "Topics include the history of hypnosis, the conscious and subconscious mind, suggestibility, dream interpretation and practical sessions. Detailed syllabus to be updated.",
    descriptionHi: "विषयों में हिप्नोसिस का इतिहास, सचेत और अवचेतन मन, सुझाव-ग्रहणशीलता, स्वप्न विश्लेषण और व्यावहारिक सेशन शामिल हैं।",
    helpsWith: "Beginners, Healers, Counsellors", durationMinutes: 960, mode: "onsite", price: null, bookableOnline: false, accent: "#b07ae0", sort: 11 },
  { code: "WEB-SUBC", type: "webinar", nameEn: "Webinar: Meet Your Subconscious Mind", nameHi: "वेबिनार: अपने अवचेतन मन से मिलें",
    shortEn: "A free 60-minute introduction to hypnosis, self-hypnosis and how the mind heals.",
    shortHi: "हिप्नोसिस, सेल्फ़-हिप्नोसिस और मन कैसे ठीक होता है — 60 मिनट का निःशुल्क परिचय।",
    descriptionEn: "An interactive online webinar with a guided relaxation and live Q&A. Placeholder — update topics and dates in Admin › Services.",
    descriptionHi: "निर्देशित विश्रांति और लाइव प्रश्नोत्तर के साथ एक इंटरैक्टिव ऑनलाइन वेबिनार।",
    helpsWith: "Curious beginners, Stress relief", durationMinutes: 60, mode: "online", price: 0, bookableOnline: false, accent: "#46a8e0", sort: 12, trainerSlug: "priyanka-b-chamoli" },
];

const TESTIMONIALS = [
  { name: "Sample client", location: "Lucknow", textEn: "I had struggled with insomnia and constant overthinking for years. After my hypnotherapy sessions I sleep through the night and feel calmer than I have in a long time.", textHi: "मैं वर्षों से अनिद्रा और लगातार सोचते रहने से परेशान थी। हिप्नोथेरेपी सेशन के बाद मैं पूरी रात सोती हूँ और बहुत शांत महसूस करती हूँ।", service: "SRV-HYP" },
  { name: "Sample client", location: "Delhi (online)", textEn: "The chakra balancing session was so gentle, yet I walked out feeling lighter and clearer. Placeholder testimonial — replace with a real one.", textHi: "चक्र संतुलन सेशन बहुत सौम्य था, फिर भी मैं हल्का और स्पष्ट महसूस करते हुए निकली।", service: "SRV-CHK" },
  { name: "Sample client", location: "Noida", textEn: "As a first-time mother I was anxious about everything. Priyanka helped me find calm and trust my body. Placeholder testimonial.", textHi: "पहली बार माँ बनने पर मैं हर बात से चिंतित थी। प्रियंका ने मुझे शांति और अपने शरीर पर भरोसा पाने में मदद की।", service: "SRV-MOM" },
  { name: "Sample student", location: "Lucknow", textEn: "The Level 1 certification was practical and deeply transformative. I practised on day one. Placeholder testimonial.", textHi: "लेवल 1 सर्टिफ़िकेशन व्यावहारिक और गहराई से परिवर्तनकारी था। पहले ही दिन मैंने अभ्यास किया।", service: "CRS-CH-L1" },
];

async function main() {
  const demo = process.argv.includes("--demo");

  // Container start-up passes --if-empty so edits and deletions made in the admin survive restarts.
  if (process.argv.includes("--if-empty") && (await db.select({ n: sql<number>`count(*)::int` }).from(s.staff))[0].n > 0) {
    console.log("Database already set up — skipping seed.");
    return;
  }

  // Staff
  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? "owner@pch.local";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "ChangeMe@123";
  await db
    .insert(s.staff)
    .values([
      { name: "Priyanka (Owner)", email: ownerEmail, passwordHash: await bcrypt.hash(ownerPassword, 10), role: "owner" },
      { name: "Demo Shop Manager", email: "shop@pch.local", passwordHash: await bcrypt.hash("ChangeMe@123", 10), role: "shop_manager" },
    ])
    .onConflictDoNothing();

  // Settings & content
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) await db.insert(s.settings).values({ key, value }).onConflictDoNothing();
  await db
    .insert(s.contentBlocks)
    .values(CONTENT.map((c, i) => ({ key: c.key, site: c.site, section: c.section, label: c.label, kind: c.kind, valueEn: c.en, valueHi: c.hi ?? null, sort: i })))
    .onConflictDoNothing();

  // Catalogue
  await db
    .insert(s.categories)
    .values(CATEGORIES.map(([en, hi], i) => ({ slug: slugify(en), nameEn: en, nameHi: hi, sort: i })))
    .onConflictDoNothing();
  const cats = await db.select().from(s.categories);
  const catId = (name: string) => cats.find((c) => c.nameEn === name)!.id;
  await db
    .insert(s.products)
    .values(
      PRODUCTS.map(([sku, name, nameHi, cat, crystals, chakras, props, zodiac, size, mrp, sale, featured], i) => ({
        sku,
        slug: slugify(name),
        nameEn: name,
        nameHi,
        categoryId: catId(cat),
        crystals,
        descriptionEn: DESC(name, crystals, props),
        healingProperties: props,
        chakras,
        zodiac,
        size,
        weightGrams: cat === "Bracelet" ? 30 : 150,
        mrp,
        salePrice: sale,
        gstPercent: cat === "Bracelet" || cat === "Pendant" || cat === "Mala" ? 3 : 5,
        hsnCode: cat === "Bracelet" || cat === "Pendant" ? "7117" : "7103",
        stockQty: [12, 25, 8, 30, 4, 18, 0, 22][i % 8],
        isFeatured: !!featured,
        status: "active" as const,
      })),
    )
    .onConflictDoNothing();

  // Healing
  await db.insert(s.trainers).values(TRAINERS).onConflictDoNothing();
  const trainerRows = await db.select().from(s.trainers);
  await db
    .insert(s.services)
    .values(
      SERVICES.map(({ trainerSlug, ...svc }) => ({
        ...svc,
        slug: slugify(svc.nameEn),
        trainerId: trainerRows.find((t) => t.slug === trainerSlug)?.id ?? null,
      })),
    )
    .onConflictDoNothing();
  const svcRows = await db.select().from(s.services);
  const svcId = (code: string) => svcRows.find((x) => x.code === code)!.id;

  if ((await db.select({ n: sql<number>`count(*)::int` }).from(s.courseBatches))[0].n === 0) {
    const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
    await db.insert(s.courseBatches).values([
      { serviceId: svcId("CRS-CH-L1"), startsOn: inDays(30), endsOn: inDays(31), timing: "09:00 AM – 06:00 PM", location: "Lucknow", mode: "onsite", seats: 12, note: "Placeholder date" },
      { serviceId: svcId("CRS-EKAA"), startsOn: inDays(58), endsOn: inDays(59), timing: "10:00 AM – 05:00 PM", location: "Lucknow", mode: "onsite", seats: 15, note: "Placeholder date" },
      { serviceId: svcId("WEB-SUBC"), startsOn: inDays(12), timing: "07:00 PM – 08:00 PM", location: "Zoom", mode: "online", seats: 100, note: "Placeholder date" },
    ]);
  }

  if ((await db.select({ n: sql<number>`count(*)::int` }).from(s.availability))[0].n === 0) {
    const rows = [1, 2, 3, 4, 5, 6].flatMap((weekday) => [
      { weekday, startTime: "10:00", endTime: "13:30" },
      { weekday, startTime: "14:30", endTime: "19:00" },
    ]);
    await db.insert(s.availability).values(rows);
  }

  if ((await db.select({ n: sql<number>`count(*)::int` }).from(s.testimonials))[0].n === 0) {
    await db.insert(s.testimonials).values(
      TESTIMONIALS.map((t) => ({ name: t.name, location: t.location, textEn: t.textEn, textHi: t.textHi, serviceId: svcId(t.service) })),
    );
  }

  await db
    .insert(s.coupons)
    .values([
      { code: "WELCOME10", type: "percent", value: 10, minOrder: 499, maxDiscount: 500 },
      { code: "HEAL100", type: "flat", value: 100, minOrder: 999 },
    ])
    .onConflictDoNothing();

  if (demo) await seedDemo();
  console.log(`Seed complete. Admin login: ${ownerEmail} / ${ownerPassword}  (change it in Admin › Staff)`);
}

/** Demo activity so dashboards and charts have something to show. Clearly prefixed DEMO-. */
async function seedDemo() {
  const existing = await db.select({ n: sql<number>`count(*)::int` }).from(s.orders);
  if (existing[0].n > 0) return;
  const prods = await db.select().from(s.products);
  const svcs = (await db.select().from(s.services)).filter((x) => x.type === "session");
  const rand = (n: number) => Math.floor(Math.random() * n);
  const cities = ["Lucknow", "Delhi", "Mumbai", "Bengaluru", "Pune", "Jaipur", "Kanpur", "Noida"];

  for (let d = 45; d >= 0; d--) {
    const day = new Date(Date.now() - d * 86400000);
    // analytics
    const views = 40 + rand(60) + (45 - d);
    const events: (typeof s.analyticsEvents.$inferInsert)[] = [];
    for (let v = 0; v < views; v++) {
      const site = Math.random() < 0.55 ? "healing" : "shop";
      const src = ["instagram", "google", "facebook", null, null][rand(5)];
      events.push({
        site,
        type: "page_view",
        path: site === "healing" ? ["/", "/services", "/courses", "/book/clinical-hypnotherapy"][rand(4)] : ["/", "/products", `/products/${prods[rand(prods.length)].slug}`][rand(3)],
        referrer: src ? `https://${src}.com/` : null,
        utmSource: src,
        utmMedium: src ? "social" : null,
        visitorId: `demo${d}-${rand(views * 0.7)}`,
        device: ["mobile", "mobile", "mobile", "desktop", "tablet"][rand(5)],
        createdAt: new Date(day.getTime() - rand(86400000)),
      });
    }
    await db.insert(s.analyticsEvents).values(events);

    // orders
    for (let o = 0; o < rand(4); o++) {
      const items = Array.from({ length: 1 + rand(3) }, () => prods[rand(prods.length)]);
      const subtotal = items.reduce((t, p) => t + Number(p.salePrice ?? p.mrp), 0);
      const shipping = subtotal >= 999 ? 0 : 79;
      const method = (["razorpay", "razorpay", "cod", "whatsapp"] as const)[rand(4)];
      const city = cities[rand(cities.length)];
      const [order] = await db
        .insert(s.orders)
        .values({
          number: `DEMO-${d}${o}${rand(999)}`,
          name: "Demo Customer",
          email: "demo@example.com",
          phone: "9000000000",
          shippingAddress: { name: "Demo Customer", phone: "9000000000", line1: "Demo street", city, state: "Uttar Pradesh", pincode: "226001" },
          subtotal,
          shipping,
          gstTotal: Math.round(subtotal * 0.03),
          total: subtotal + shipping,
          paymentMethod: method,
          paymentStatus: method === "razorpay" || d > 7 ? "paid" : "pending",
          status: d > 10 ? "delivered" : d > 3 ? "shipped" : "new",
          createdAt: new Date(day.getTime() - rand(80000000)),
        })
        .returning();
      await db.insert(s.orderItems).values(
        items.map((p) => ({ orderId: order.id, productId: p.id, sku: p.sku, name: p.nameEn, hsnCode: p.hsnCode, unitPrice: Number(p.salePrice ?? p.mrp), qty: 1, gstPercent: Number(p.gstPercent) })),
      );
    }

    // bookings
    for (let b = 0; b < rand(3); b++) {
      const svc = svcs[rand(svcs.length)];
      const start = new Date(day);
      start.setUTCHours(5 + rand(8), 0, 0, 0);
      await db.insert(s.bookings).values({
        number: `DEMO-B${d}${b}${rand(999)}`,
        serviceId: svc.id,
        serviceName: svc.nameEn,
        name: "Demo Client",
        email: "demo@example.com",
        phone: "9000000000",
        startsAt: start,
        endsAt: new Date(start.getTime() + (svc.durationMinutes ?? 60) * 60000),
        mode: Math.random() < 0.5 ? "online" : "onsite",
        price: Number(svc.price ?? 0),
        paymentStatus: "paid",
        status: d > 0 ? "completed" : "confirmed",
        createdAt: new Date(start.getTime() - 3 * 86400000),
      });
    }

    if (d % 7 === 0) {
      await db.insert(s.marketingSpend).values([
        { day: day.toISOString().slice(0, 10), brand: "shop", channel: "Meta Ads", campaign: "DEMO crystal reels", amount: 2500 + rand(1500) },
        { day: day.toISOString().slice(0, 10), brand: "healing", channel: "Google Ads", campaign: "DEMO hypnotherapy Lucknow", amount: 1800 + rand(1200) },
      ]);
    }
  }
  await db.insert(s.enquiries).values([
    { kind: "course", name: "Demo Enquirer", email: "demo@example.com", phone: "9000000000", message: "When is the next Level 1 batch? (demo)" },
    { kind: "contact", name: "Demo Visitor", phone: "9000000001", message: "Do you offer sessions in Hindi? (demo)" },
  ]);
  console.log("Demo activity added.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
