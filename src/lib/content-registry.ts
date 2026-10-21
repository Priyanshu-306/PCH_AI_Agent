// Every editable text/media slot on both websites. Admin › Content edits these; the
// defaults below are used until a value is saved, and by the seed script.
export type ContentDef = {
  key: string;
  site: "healing" | "shop";
  section: string;
  label: string;
  kind: "text" | "longtext" | "image" | "video" | "url";
  en: string;
  hi?: string;
};

export const CONTENT: ContentDef[] = [
  /* ------------------------------------------------------------ Healing: hero */
  { key: "healing.hero.eyebrow", site: "healing", section: "Hero", label: "Eyebrow line", kind: "text",
    en: "Clinical Hypnotherapy · Chakra Healing · Energy Alignment",
    hi: "क्लिनिकल हिप्नोथेरेपी · चक्र हीलिंग · ऊर्जा संतुलन" },
  { key: "healing.hero.title", site: "healing", section: "Hero", label: "Headline", kind: "text",
    en: "Return to your pure, conscious self",
    hi: "अपने शुद्ध, सचेत स्वरूप की ओर लौटें" },
  { key: "healing.hero.subtitle", site: "healing", section: "Hero", label: "Sub-headline", kind: "longtext",
    en: "Gentle, deeply personal healing for anxiety, stress, sleeplessness and the stories we carry — online and in our healing space.",
    hi: "चिंता, तनाव, अनिद्रा और मन में दबी कहानियों के लिए सौम्य और व्यक्तिगत हीलिंग — ऑनलाइन और हमारे हीलिंग स्पेस में।" },
  { key: "healing.hero.video", site: "healing", section: "Hero", label: "Background video (optional)", kind: "video", en: "" },

  /* ------------------------------------------------------------ Healing: intro */
  { key: "healing.intro.title", site: "healing", section: "Introduction", label: "Title", kind: "text",
    en: "Healing that meets you exactly where you are",
    hi: "हीलिंग जो आपसे वहीं मिलती है जहाँ आप हैं" },
  { key: "healing.intro.body", site: "healing", section: "Introduction", label: "Body", kind: "longtext",
    en: "Every session is a safe, unhurried space to slow down, listen inward and release what no longer serves you. We blend clinical hypnotherapy with chakra and energy work so that mind, body and spirit can move back into balance together.",
    hi: "हर सेशन एक सुरक्षित और शांत स्थान है — जहाँ आप ठहर सकते हैं, भीतर की आवाज़ सुन सकते हैं और जो अब आपके काम का नहीं उसे छोड़ सकते हैं। हम क्लिनिकल हिप्नोथेरेपी को चक्र और ऊर्जा कार्य के साथ जोड़ते हैं ताकि मन, शरीर और आत्मा एक साथ संतुलन में लौट सकें।" },
  { key: "healing.intro.stat1", site: "healing", section: "Introduction", label: "Highlight 1", kind: "text", en: "Online & in person", hi: "ऑनलाइन और व्यक्तिगत" },
  { key: "healing.intro.stat2", site: "healing", section: "Introduction", label: "Highlight 2", kind: "text", en: "Certified clinical hypnotherapists", hi: "प्रमाणित क्लिनिकल हिप्नोथेरेपिस्ट" },
  { key: "healing.intro.stat3", site: "healing", section: "Introduction", label: "Highlight 3", kind: "text", en: "Completely confidential", hi: "पूर्णतः गोपनीय" },

  /* ------------------------------------------------------------ Healing: services */
  { key: "healing.services.title", site: "healing", section: "Services", label: "Title", kind: "text",
    en: "Healing services", hi: "हीलिंग सेवाएँ" },
  { key: "healing.services.subtitle", site: "healing", section: "Services", label: "Subtitle", kind: "longtext",
    en: "Choose the path that calls to you. Not sure where to begin? Book a session and we will guide you.",
    hi: "वह मार्ग चुनें जो आपको पुकारता है। समझ नहीं आ रहा कहाँ से शुरू करें? एक सेशन बुक करें, हम आपका मार्गदर्शन करेंगे।" },

  /* ------------------------------------------------------------ Healing: chakra journey */
  { key: "healing.chakra.title", site: "healing", section: "Chakra journey", label: "Title", kind: "text",
    en: "A journey through your seven energy centres", hi: "आपके सात ऊर्जा केंद्रों की यात्रा" },
  { key: "healing.chakra.body", site: "healing", section: "Chakra journey", label: "Body", kind: "longtext",
    en: "When one centre is blocked, the whole system feels it. Chakra balancing gently restores the flow — from grounding at the root to clarity at the crown.",
    hi: "जब एक केंद्र अवरुद्ध होता है, तो पूरा तंत्र उसे महसूस करता है। चक्र संतुलन धीरे-धीरे प्रवाह को पुनः स्थापित करता है — मूलाधार की स्थिरता से सहस्रार की स्पष्टता तक।" },

  /* ------------------------------------------------------------ Healing: space */
  { key: "healing.space.title", site: "healing", section: "Healing space", label: "Title", kind: "text",
    en: "Step inside the healing space", hi: "हीलिंग स्पेस में कदम रखें" },
  { key: "healing.space.body", site: "healing", section: "Healing space", label: "Body", kind: "longtext",
    en: "Soft light, the scent of sandalwood, crystals charged under the moon. Our studio is designed to help your nervous system feel safe from the moment you arrive.",
    hi: "हल्की रोशनी, चंदन की सुगंध, चाँदनी में ऊर्जित क्रिस्टल। हमारा स्टूडियो इस तरह बनाया गया है कि आते ही आपका मन सुरक्षित महसूस करे।" },
  { key: "healing.space.video", site: "healing", section: "Healing space", label: "Scroll video of the space", kind: "video", en: "" },
  { key: "healing.space.image1", site: "healing", section: "Healing space", label: "Photo 1", kind: "image", en: "" },
  { key: "healing.space.image2", site: "healing", section: "Healing space", label: "Photo 2", kind: "image", en: "" },
  { key: "healing.space.image3", site: "healing", section: "Healing space", label: "Photo 3", kind: "image", en: "" },

  /* ------------------------------------------------------------ Healing: founder */
  { key: "healing.founder.title", site: "healing", section: "Founder", label: "Title", kind: "text",
    en: "Meet Priyanka B. Chamoli", hi: "प्रियंका बी. चमोली से मिलें" },
  { key: "healing.founder.role", site: "healing", section: "Founder", label: "Role line", kind: "text",
    en: "Founder · Certified Clinical Hypnotherapist · Motivational Speaker",
    hi: "संस्थापक · प्रमाणित क्लिनिकल हिप्नोथेरेपिस्ट · प्रेरक वक्ता" },
  { key: "healing.founder.story", site: "healing", section: "Founder", label: "Story", kind: "longtext",
    en: "For years, Priyanka lived with a breathing problem that no treatment could fully resolve. Hypnotherapy changed that — and changed the direction of her life. An MBA from IBS Gurgaon, she left the corporate path to train as a clinical hypnotherapist, with a special focus on supporting expecting and new mothers. Today she guides people through anxiety, trauma, sleeplessness and life transitions with warmth, science and deep respect for each person's journey.",
    hi: "वर्षों तक प्रियंका एक साँस की समस्या के साथ जीती रहीं, जिसका कोई इलाज पूरी तरह कारगर नहीं हुआ। हिप्नोथेरेपी ने इसे बदल दिया — और उनके जीवन की दिशा भी। IBS गुड़गाँव से MBA करने के बाद उन्होंने कॉर्पोरेट राह छोड़कर क्लिनिकल हिप्नोथेरेपिस्ट के रूप में प्रशिक्षण लिया, विशेष रूप से गर्भवती और नई माताओं के सहयोग पर ध्यान देते हुए। आज वे चिंता, आघात, अनिद्रा और जीवन के बदलावों में लोगों का स्नेह, विज्ञान और गहरे सम्मान के साथ मार्गदर्शन करती हैं।" },
  { key: "healing.founder.quote", site: "healing", section: "Founder", label: "Quote", kind: "text",
    en: "“Healing is not becoming someone new. It is remembering who you were before the world got loud.”",
    hi: "“हीलिंग कोई नया व्यक्ति बनना नहीं है। यह याद करना है कि दुनिया के शोर से पहले आप कौन थे।”" },
  { key: "healing.founder.image", site: "healing", section: "Founder", label: "Portrait", kind: "image", en: "" },

  /* ------------------------------------------------------------ Healing: trainers & courses */
  { key: "healing.trainers.title", site: "healing", section: "Trainers", label: "Title", kind: "text", en: "Our trainers", hi: "हमारे प्रशिक्षक" },
  { key: "healing.trainers.subtitle", site: "healing", section: "Trainers", label: "Subtitle", kind: "longtext",
    en: "Experienced practitioners who teach from their own healing practice.",
    hi: "अनुभवी विशेषज्ञ जो अपने स्वयं के हीलिंग अभ्यास से सिखाते हैं।" },
  { key: "healing.courses.title", site: "healing", section: "Courses", label: "Title", kind: "text",
    en: "Learn to heal — certification courses & workshops", hi: "हीलिंग सीखें — सर्टिफ़िकेशन कोर्स और वर्कशॉप" },
  { key: "healing.courses.subtitle", site: "healing", section: "Courses", label: "Subtitle", kind: "longtext",
    en: "Practical, experiential training in clinical hypnotherapy and energy healing — for personal growth or a new profession.",
    hi: "क्लिनिकल हिप्नोथेरेपी और ऊर्जा हीलिंग का व्यावहारिक, अनुभवात्मक प्रशिक्षण — व्यक्तिगत विकास या नए पेशे के लिए।" },

  /* ------------------------------------------------------------ Healing: testimonials, crystals, CTA */
  { key: "healing.testimonials.title", site: "healing", section: "Testimonials", label: "Title", kind: "text", en: "Stories of healing", hi: "हीलिंग की कहानियाँ" },
  { key: "healing.crystals.title", site: "healing", section: "Crystal showcase", label: "Title", kind: "text",
    en: "Crystals, chosen with intention", hi: "इरादे के साथ चुने गए क्रिस्टल" },
  { key: "healing.crystals.body", site: "healing", section: "Crystal showcase", label: "Body", kind: "longtext",
    en: "Every crystal we use in our sessions is cleansed, energised and available at Pure Crystal Hub — so the support can continue at home.",
    hi: "हमारे सेशन में उपयोग होने वाला हर क्रिस्टल शुद्ध और ऊर्जित किया जाता है और प्योर क्रिस्टल हब पर उपलब्ध है — ताकि यह सहयोग घर पर भी जारी रहे।" },
  { key: "healing.cta.title", site: "healing", section: "Closing call to action", label: "Title", kind: "text",
    en: "Your healing can begin today", hi: "आपकी हीलिंग आज से शुरू हो सकती है" },
  { key: "healing.cta.body", site: "healing", section: "Closing call to action", label: "Body", kind: "longtext",
    en: "Book a session online in under two minutes, or message us on WhatsApp — we are happy to answer any question first.",
    hi: "दो मिनट से कम में ऑनलाइन सेशन बुक करें, या व्हाट्सऐप पर संदेश भेजें — हम पहले आपके हर प्रश्न का उत्तर देने को तैयार हैं।" },
  { key: "healing.footer.tagline", site: "healing", section: "Footer", label: "Tagline", kind: "text",
    en: "Holistic healing for mind, body and spirit.", hi: "मन, शरीर और आत्मा के लिए समग्र हीलिंग।" },

  /* ------------------------------------------------------------ Shop */
  { key: "shop.announcement", site: "shop", section: "Top bar", label: "Announcement", kind: "text",
    en: "Free shipping above ₹999 · Cash on delivery available · Energised before dispatch",
    hi: "₹999 से ऊपर मुफ़्त शिपिंग · कैश ऑन डिलीवरी उपलब्ध · भेजने से पहले ऊर्जित" },
  { key: "shop.hero.eyebrow", site: "shop", section: "Hero", label: "Eyebrow", kind: "text", en: "Pure Crystal Hub", hi: "प्योर क्रिस्टल हब" },
  { key: "shop.hero.title", site: "shop", section: "Hero", label: "Headline", kind: "text",
    en: "Crystals that carry intention", hi: "इरादे से भरे क्रिस्टल" },
  { key: "shop.hero.subtitle", site: "shop", section: "Hero", label: "Sub-headline", kind: "longtext",
    en: "Natural, hand-picked and energised by healers at Pure Conscious Healing. Find the stone that resonates with you.",
    hi: "प्राकृतिक, हाथ से चुने गए और प्योर कॉन्शियस हीलिंग के हीलर्स द्वारा ऊर्जित। वह पत्थर खोजें जो आपसे मेल खाता है।" },
  { key: "shop.hero.video", site: "shop", section: "Hero", label: "Background video (optional)", kind: "video", en: "" },
  { key: "shop.promise.1", site: "shop", section: "Promises", label: "Promise 1", kind: "text", en: "100% natural crystals", hi: "100% प्राकृतिक क्रिस्टल" },
  { key: "shop.promise.2", site: "shop", section: "Promises", label: "Promise 2", kind: "text", en: "Cleansed & energised by healers", hi: "हीलर्स द्वारा शुद्ध और ऊर्जित" },
  { key: "shop.promise.3", site: "shop", section: "Promises", label: "Promise 3", kind: "text", en: "Pan-India delivery · COD", hi: "पूरे भारत में डिलीवरी · COD" },
  { key: "shop.promise.4", site: "shop", section: "Promises", label: "Promise 4", kind: "text", en: "Secure payments by Razorpay", hi: "Razorpay द्वारा सुरक्षित भुगतान" },
  { key: "shop.collections.title", site: "shop", section: "Collections", label: "Title", kind: "text", en: "Shop by collection", hi: "कलेक्शन के अनुसार खरीदें" },
  { key: "shop.featured.title", site: "shop", section: "Featured", label: "Title", kind: "text", en: "Loved by our healers", hi: "हमारे हीलर्स की पसंद" },
  { key: "shop.intentions.title", site: "shop", section: "Intentions", label: "Title", kind: "text", en: "Shop by intention", hi: "उद्देश्य के अनुसार खरीदें" },
  { key: "shop.ritual.title", site: "shop", section: "Crystal care", label: "Title", kind: "text", en: "Caring for your crystals", hi: "अपने क्रिस्टल की देखभाल" },
  { key: "shop.ritual.body", site: "shop", section: "Crystal care", label: "Body", kind: "longtext",
    en: "Cleanse with smoke, sound or moonlight. Set an intention while holding the stone. Recharge monthly on the full moon — and keep it close.",
    hi: "धुएँ, ध्वनि या चाँदनी से शुद्ध करें। पत्थर को हाथ में लेकर इरादा तय करें। हर पूर्णिमा पर पुनः ऊर्जित करें — और इसे अपने पास रखें।" },
  { key: "shop.about.title", site: "shop", section: "About", label: "Title", kind: "text",
    en: "Born in a healing room", hi: "एक हीलिंग कक्ष में जन्मा" },
  { key: "shop.about.body", site: "shop", section: "About", label: "Body", kind: "longtext",
    en: "Pure Crystal Hub is the crystal home of Pure Conscious Healing. The stones we offer are the ones our healers trust in their own sessions.",
    hi: "प्योर क्रिस्टल हब, प्योर कॉन्शियस हीलिंग का क्रिस्टल घर है। हम वही पत्थर देते हैं जिन पर हमारे हीलर्स अपने सेशन में भरोसा करते हैं।" },
];

export const contentDefaults = (site: "healing" | "shop") => CONTENT.filter((c) => c.site === site);
