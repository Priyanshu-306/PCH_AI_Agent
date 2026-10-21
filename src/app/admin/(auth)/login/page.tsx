import { redirect } from "next/navigation";
import { getStaff } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata = { title: "Admin sign in", robots: { index: false } };

export default async function AdminLogin() {
  if (await getStaff()) redirect("/admin");
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_30%_20%,#e6dbf4,transparent_50%),radial-gradient(circle_at_80%_80%,#f6efe4,transparent_50%),#faf7fd] p-4">
      <div className="w-full max-w-sm rounded-3xl border border-lavender-200 bg-white p-8 shadow-card">
        <p className="eyebrow text-gold-600">Pure Conscious Healing</p>
        <h1 className="mt-2 text-2xl font-bold text-plum-900">Admin sign in</h1>
        <p className="mt-1 mb-6 text-sm text-ink-soft">Manage both websites from one place.</p>
        <LoginForm />
      </div>
    </main>
  );
}
