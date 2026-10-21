// Placeholder policy pages. Razorpay requires these to be live before activating payments;
// have them reviewed and edited for the business before launch.
type Policy = { title: string; body: string[] };

const contactLine = "For any questions, write to pureconscioushealing@gmail.com or message us on WhatsApp.";

export const POLICIES: Record<"healing" | "shop", Record<string, Policy>> = {
  healing: {
    privacy: {
      title: "Privacy policy",
      body: [
        "We collect only the information needed to book and deliver your sessions: your name, contact details and anything you choose to share about your concerns.",
        "Everything discussed in a session is strictly confidential and is never shared without your written consent, except where required by law.",
        "Payments are processed securely by Razorpay. We never see or store your card details.",
        contactLine,
      ],
    },
    terms: {
      title: "Terms of service",
      body: [
        "Our sessions are complementary wellbeing practices and are not a substitute for medical or psychiatric diagnosis or treatment. Please continue any treatment prescribed by your doctor.",
        "Clients must be 18 or older, or attend with a guardian's consent.",
        "Course certificates are issued on full attendance and completion of practice requirements.",
        contactLine,
      ],
    },
    refunds: {
      title: "Cancellations & refunds",
      body: [
        "You may reschedule a session free of charge up to 24 hours before the start time.",
        "Cancellations made more than 24 hours in advance receive a full refund to the original payment method within 5–7 working days.",
        "Cancellations within 24 hours, and missed sessions, are not refundable. Course fees are refundable up to 7 days before the batch start date.",
        contactLine,
      ],
    },
  },
  shop: {
    privacy: {
      title: "Privacy policy",
      body: [
        "We use your details only to process and deliver your order and to keep you updated about it.",
        "Payments are processed securely by Razorpay. We never see or store your card details.",
        contactLine,
      ],
    },
    terms: {
      title: "Terms of sale",
      body: [
        "Crystals are natural; colour, pattern, size and shape vary from the photographs and 3D previews.",
        "Crystal healing is a complementary practice and is not a substitute for medical advice or treatment.",
        "Prices are in Indian Rupees and inclusive of GST.",
        contactLine,
      ],
    },
    shipping: {
      title: "Shipping policy",
      body: [
        "We ship across India. Orders are dispatched within 1–2 working days and usually arrive within 3–7 working days.",
        "Shipping is free on orders above the free-shipping threshold shown at checkout; otherwise a flat fee applies. Cash on delivery carries a small handling fee.",
        "You will receive tracking details by email and WhatsApp once your order ships.",
        contactLine,
      ],
    },
    returns: {
      title: "Returns & refunds",
      body: [
        "If your item arrives damaged, please share an unboxing video within 48 hours of delivery and we will replace it or refund you in full.",
        "Because crystals are energetically personal, we do not accept returns for change of mind.",
        "Approved refunds are made to the original payment method within 5–7 working days (prepaid orders) or by bank transfer/UPI (COD orders).",
        contactLine,
      ],
    },
  },
};
