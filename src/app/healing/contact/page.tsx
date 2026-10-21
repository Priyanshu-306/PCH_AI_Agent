import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getDict } from "@/i18n/server";
import { getSetting } from "@/lib/settings";
import PageHero from "@/components/healing/PageHero";
import EnquiryForm from "@/components/healing/EnquiryForm";
import Reveal from "@/components/common/Reveal";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const { lang, t } = await getDict();
  const contact = await getSetting("contact");
  const items = [
    { icon: Phone, label: contact.phone, href: `tel:${contact.phone.replace(/\s/g, "")}` },
    { icon: MessageCircle, label: "WhatsApp", href: `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}` },
    { icon: Mail, label: contact.email, href: `mailto:${contact.email}` },
    { icon: Clock, label: contact.hours },
    { icon: MapPin, label: contact.address },
  ];
  return (
    <>
      <PageHero eyebrow={t.nav.contact} title={lang === "hi" ? "हमसे बात करें" : "Let’s talk"} body={lang === "hi" ? "कोई प्रश्न? हम एक कार्यदिवस के भीतर उत्तर देते हैं।" : "Have a question before you book? We reply within one working day."} />
      <section className="pb-10">
        <div className="container-x grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal className="space-y-3">
            {items.map(({ icon: Icon, label, href }) => {
              const inner = (
                <>
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-lavender-100 text-plum-700"><Icon className="size-5" /></span>
                  <span className="font-medium break-words text-plum-900">{label}</span>
                </>
              );
              return href ? (
                <a key={label} href={href} className="glass flex items-center gap-4 rounded-2xl p-4 transition hover:shadow-glow">{inner}</a>
              ) : (
                <div key={label} className="glass flex items-center gap-4 rounded-2xl p-4">{inner}</div>
              );
            })}
            {contact.mapEmbedUrl && <iframe src={contact.mapEmbedUrl} title="Map" loading="lazy" className="mt-3 aspect-video w-full rounded-2xl border-0" />}
          </Reveal>
          <Reveal delay={150} className="glass rounded-[32px] p-6 shadow-card sm:p-9">
            <EnquiryForm kind="contact" labels={{ name: t.common.name, email: t.common.email, phone: t.common.phone, message: t.common.message, send: t.common.send, sending: t.common.sending, thankYou: t.common.thankYou, sent: t.healing.enquirySent }} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
