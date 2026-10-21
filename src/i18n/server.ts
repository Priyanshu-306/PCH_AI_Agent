import "server-only";
import { cookies } from "next/headers";
import { dictionaries, type Lang } from "./dictionaries";

export async function getLang(): Promise<Lang> {
  return (await cookies()).get("lang")?.value === "hi" ? "hi" : "en";
}

export async function getDict() {
  const lang = await getLang();
  return { lang, t: dictionaries[lang] };
}

export { pick } from "./dictionaries";
