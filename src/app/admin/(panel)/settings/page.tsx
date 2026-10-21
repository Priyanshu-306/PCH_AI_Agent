import { requireStaff } from "@/lib/auth";
import { getSettings, SETTING_DEFAULTS, type SettingKey } from "@/lib/settings";
import { razorpayLive } from "@/lib/payments";
import { saveSettings } from "@/app/admin/actions/system";
import { Badge, Card, Field, PageHeader, input } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Settings" };

const TITLES: Record<SettingKey, string> = { contact: "Contact details (both sites)", shipping: "Shipping, COD & WhatsApp orders", business: "Business & GST invoice", booking: "Session booking rules" };
const HINTS: Record<string, string> = {
  whatsapp: "Country code + number, digits only, e.g. 919876543210",
  mapEmbedUrl: "Google Maps › Share › Embed a map › copy the src URL",
  freeAbove: "Orders at or above this (after discount) ship free",
  codMaxOrder: "COD hidden above this order total",
  gstin: "Printed on GST invoices",
  state: "Used to choose CGST+SGST vs IGST",
  slotStepMinutes: "Start times offered every N minutes",
  minLeadHours: "Earliest booking from now",
  maxDaysAhead: "How far ahead clients can book",
  holdMinutes: "An unpaid booking holds its slot this long",
};
const label = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

export default async function SettingsPage() {
  await requireStaff("settings");
  const keys = Object.keys(SETTING_DEFAULTS) as SettingKey[];
  const all = await getSettings(...keys);
  const flags = [
    ["Razorpay payments", razorpayLive(), "Test checkout until RAZORPAY_KEY_ID / SECRET are set"],
    ["Email (SMTP)", Boolean(process.env.SMTP_HOST), "Emails are logged in Notifications until SMTP_* is set"],
    ["WhatsApp Business API", Boolean(process.env.WHATSAPP_PROVIDER), "Messages are logged until WHATSAPP_PROVIDER is set"],
  ] as const;
  return (
    <>
      <PageHeader title="Settings" />
      <Card title="Integrations" className="mb-6">
        <ul className="grid gap-3 text-sm sm:grid-cols-3">
          {flags.map(([name, on, hint]) => (
            <li key={name} className="rounded-xl border border-lavender-200 p-3"><p className="flex items-center justify-between font-semibold">{name}<Badge tone={on ? "green" : "amber"}>{on ? "connected" : "test mode"}</Badge></p><p className="mt-1 text-xs text-ink-soft">{hint}</p></li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-soft">API keys live in the server’s <code>.env</code> file (never in the database) — see README › Going live.</p>
      </Card>
      <div className="space-y-6">
        {keys.map((key) => {
          const values = all[key] as Record<string, unknown>;
          return (
            <Card key={key} title={TITLES[key]}>
              <form id={key} action={saveSettings} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="key" value={key} />
                {Object.entries(SETTING_DEFAULTS[key]).map(([k, def]) =>
                  typeof def === "boolean" ? (
                    <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" name={k} defaultChecked={Boolean(values[k])} className="size-4 accent-[#5b3e8c]" /> {label(k)}</label>
                  ) : (
                    <Field key={k} label={label(k)} hint={HINTS[k]} className={typeof def === "string" && def.length > 40 ? "sm:col-span-2" : ""}>
                      <input name={k} type={typeof def === "number" ? "number" : "text"} defaultValue={String(values[k] ?? "")} className={input} />
                    </Field>
                  ),
                )}
                <div className="sm:col-span-2"><SubmitButton>Save</SubmitButton></div>
              </form>
            </Card>
          );
        })}
      </div>
    </>
  );
}
