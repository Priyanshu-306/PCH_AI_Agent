import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { getDict } from "@/i18n/server";
import { getCustomer } from "@/lib/auth";
import CheckoutForm from "@/components/shop/CheckoutForm";

export const metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ coupon?: string }> }) {
  const { coupon } = await searchParams;
  const { t } = await getDict();
  const customer = await getCustomer();
  const saved = customer ? await db.select().from(addresses).where(eq(addresses.customerId, customer.id)).orderBy(desc(addresses.isDefault)) : [];
  return (
    <section className="pt-36 pb-10">
      <div className="container-x">
        <h1 className="font-carved text-5xl">{t.shop.checkout}</h1>
        <div className="mt-8">
          <CheckoutForm
            coupon={coupon ?? null}
            prefill={{ name: customer?.name ?? "", email: customer?.email ?? "", phone: customer?.phone ?? "" }}
            saved={saved}
            labels={{
              subtotal: t.shop.subtotal, discount: t.shop.discount, shipping: t.shop.shipping, free: t.shop.free, codFee: t.shop.codFee, total: t.shop.total, inclGst: t.shop.inclGst,
              payment: t.shop.payment, payOnline: t.shop.payOnline, cod: t.shop.cod, whatsapp: t.shop.whatsapp, placeOrder: t.shop.placeOrder, empty: t.shop.cartEmpty, continue: t.shop.continueShopping,
              name: t.common.name, email: t.common.email, phone: t.common.phone, address: t.shop.address, address2: t.shop.address2, city: t.shop.city, state: t.shop.state, pincode: t.shop.pincode, shippingTo: t.shop.shippingTo, notes: t.common.message,
            }}
          />
        </div>
      </div>
    </section>
  );
}
