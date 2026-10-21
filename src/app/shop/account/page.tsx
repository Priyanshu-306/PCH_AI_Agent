import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, orders } from "@/db/schema";
import { getDict } from "@/i18n/server";
import { getCustomer } from "@/lib/auth";
import { accessToken } from "@/lib/checkout";
import { fmtDate, inr } from "@/lib/format";
import { logoutCustomer } from "@/app/actions/customer";
import AuthForms from "@/components/shop/AuthForms";
import AddressBook from "@/components/shop/AddressBook";

export const metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { t } = await getDict();
  const customer = await getCustomer();
  const { next } = await searchParams;
  if (!customer)
    return (
      <section className="pt-36 pb-10">
        <div className="container-x">
          <h1 className="text-center font-carved text-5xl">{t.nav.account}</h1>
          <div className="mt-8">
            <AuthForms next={next} labels={{ login: t.shop.login, register: t.shop.register, name: t.common.name, email: t.common.email, phone: t.common.phone, password: t.shop.password }} />
          </div>
        </div>
      </section>
    );
  const [myOrders, myAddresses] = await Promise.all([
    db.select().from(orders).where(eq(orders.customerId, customer.id)).orderBy(desc(orders.createdAt)),
    db.select().from(addresses).where(eq(addresses.customerId, customer.id)),
  ]);
  return (
    <section className="pt-36 pb-10">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-amethyst-300">{t.nav.account}</p>
            <h1 className="mt-2 font-carved text-5xl">Namaste, {customer.name.split(" ")[0]}</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/wishlist" className="btn btn-ghost-dark">{t.nav.wishlist}</Link>
            <form action={logoutCustomer}><button className="btn btn-ghost-dark">{t.shop.logout}</button></form>
          </div>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <h2 className="font-carved text-2xl">{t.shop.myOrders}</h2>
            {myOrders.length ? (
              <ul className="mt-4 space-y-3">
                {myOrders.map((o) => (
                  <li key={o.id}>
                    <Link href={`/order/${o.number}?t=${accessToken(o.number)}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-night-800/70 p-4 hover:border-white/25">
                      <span><b>{o.number}</b><span className="ml-3 text-sm text-crystal/55">{fmtDate(o.createdAt)}</span></span>
                      <span className="rounded-full bg-amethyst-500/15 px-3 py-1 text-xs font-semibold text-amethyst-300 capitalize">{o.status}</span>
                      <span className="font-semibold">{inr(o.total)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-crystal/60">No orders yet.</p>
            )}
          </div>
          <div>
            <h2 className="font-carved text-2xl">Addresses</h2>
            <div className="mt-4"><AddressBook list={myAddresses} /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
