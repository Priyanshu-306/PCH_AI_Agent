// Representative colours for crystals, used by 3D renders and placeholder artwork
// until real product photos are uploaded.
export type CrystalTone = { base: string; light: string; deep: string };

const TONES: Record<string, CrystalTone> = {
  amethyst: { base: "#9b6ad6", light: "#d9c4f5", deep: "#4b2a7a" },
  "rose quartz": { base: "#f2b8c8", light: "#fde3ea", deep: "#c06b88" },
  citrine: { base: "#f2b84b", light: "#fde6a8", deep: "#b0701a" },
  "tiger eye": { base: "#b8782e", light: "#e8c07a", deep: "#5e3812" },
  "black tourmaline": { base: "#2d2a33", light: "#6b6676", deep: "#0c0b10" },
  pyrite: { base: "#c9b06a", light: "#ece0a8", deep: "#7a6630" },
  "green aventurine": { base: "#5fae7a", light: "#bfe7c9", deep: "#2a6640" },
  "lapis lazuli": { base: "#2f4fa8", light: "#8aa4ea", deep: "#142a66" },
  moonstone: { base: "#dfe6f0", light: "#ffffff", deep: "#9aa8c0" },
  "clear quartz": { base: "#eef3fb", light: "#ffffff", deep: "#b7c4da" },
  selenite: { base: "#f4f1ea", light: "#ffffff", deep: "#cfc6b4" },
  lepidolite: { base: "#b69ac9", light: "#e5d8ee", deep: "#6e5384" },
  carnelian: { base: "#e0673a", light: "#f6b393", deep: "#93341a" },
  "red jasper": { base: "#a8402f", light: "#d98b7c", deep: "#5c1c13" },
  sodalite: { base: "#3c5aa0", light: "#93a9dc", deep: "#1c2b5a" },
  "smoky quartz": { base: "#8a7666", light: "#c9b9aa", deep: "#433528" },
  labradorite: { base: "#5c7488", light: "#a9c6d6", deep: "#2a3846" },
  malachite: { base: "#2f9a6a", light: "#8fd8b4", deep: "#125038" },
};

const SEVEN_CHAKRA: CrystalTone = { base: "#9b7fd4", light: "#f2c6d4", deep: "#3a2a6a" };

export function crystalTone(crystals: string | null | undefined): CrystalTone {
  const list = (crystals ?? "").toLowerCase();
  if (list.includes("chakra")) return SEVEN_CHAKRA;
  for (const [name, tone] of Object.entries(TONES)) if (list.includes(name)) return tone;
  return TONES.amethyst;
}

export const CHAKRAS = [
  { key: "Root", sanskrit: "Muladhara", hi: "मूलाधार", color: "#d94040", theme: "Grounding & safety", themeHi: "स्थिरता और सुरक्षा" },
  { key: "Sacral", sanskrit: "Svadhisthana", hi: "स्वाधिष्ठान", color: "#f08a3c", theme: "Creativity & emotion", themeHi: "रचनात्मकता और भावना" },
  { key: "Solar Plexus", sanskrit: "Manipura", hi: "मणिपुर", color: "#f2c53d", theme: "Confidence & will", themeHi: "आत्मविश्वास और इच्छाशक्ति" },
  { key: "Heart", sanskrit: "Anahata", hi: "अनाहत", color: "#5fbf7a", theme: "Love & compassion", themeHi: "प्रेम और करुणा" },
  { key: "Throat", sanskrit: "Vishuddha", hi: "विशुद्ध", color: "#46a8e0", theme: "Truth & expression", themeHi: "सत्य और अभिव्यक्ति" },
  { key: "Third Eye", sanskrit: "Ajna", hi: "आज्ञा", color: "#5a5fd6", theme: "Intuition & insight", themeHi: "अंतर्ज्ञान और दृष्टि" },
  { key: "Crown", sanskrit: "Sahasrara", hi: "सहस्रार", color: "#b07ae0", theme: "Connection & awareness", themeHi: "जुड़ाव और चेतना" },
] as const;

export const ZODIAC = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;
