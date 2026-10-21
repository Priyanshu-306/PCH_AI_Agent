import { getDict } from "@/i18n/server";
import CartView from "@/components/shop/CartView";

export const metadata = { title: "Cart" };

export default async function CartPage() {
  const { lang, t } = await getDict();
  return (
    <section className="pt-36 pb-10">
      <div className="container-x">
        <h1 className="font-carved text-5xl">{t.nav.cart}</h1>
        <div className="mt-8">
          <CartView
            lang={lang}
            labels={{
              subtotal: t.shop.subtotal, discount: t.shop.discount, shipping: t.shop.shipping, free: t.shop.free, codFee: t.shop.codFee, total: t.shop.total, inclGst: t.shop.inclGst,
              empty: t.shop.cartEmpty, continue: t.shop.continueShopping, checkout: t.shop.checkout, coupon: t.shop.coupon, apply: t.shop.apply,
              freeHint: lang === "hi" ? "मुफ़्त शिपिंग के लिए {amount} और जोड़ें" : "Add {amount} more for free shipping",
            }}
          />
        </div>
      </div>
    </section>
  );
}
