import Link from "next/link";

export default function NotFound() {
  return (
    <section className="grid min-h-[80svh] place-items-center pt-28 text-center">
      <div>
        <p className="eyebrow text-amethyst-300">404</p>
        <h1 className="mt-4 font-carved text-5xl">This crystal has moved on</h1>
        <Link href="/products" className="btn btn-gold mt-8">Browse crystals</Link>
      </div>
    </section>
  );
}
