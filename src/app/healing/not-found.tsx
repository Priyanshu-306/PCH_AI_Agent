import Link from "next/link";

export default function NotFound() {
  return (
    <section data-scene="page" className="grid min-h-[80svh] place-items-center pt-28">
      <div className="text-center">
        <p className="eyebrow text-gold-600">404</p>
        <h1 className="mt-4 font-display text-6xl font-light text-plum-900">This path is still unwritten</h1>
        <Link href="/" className="btn btn-primary mt-8">Return home</Link>
      </div>
    </section>
  );
}
