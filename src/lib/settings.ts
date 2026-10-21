import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

import { SETTING_DEFAULTS } from "./settings-defaults";

export { SETTING_DEFAULTS };

type Defaults = typeof SETTING_DEFAULTS;
export type SettingKey = keyof Defaults;
type Widen<T> = { -readonly [K in keyof T]: T[K] extends string ? string : T[K] extends number ? number : T[K] extends boolean ? boolean : T[K] };
export type Settings = { [K in SettingKey]: Widen<Defaults[K]> };

export async function getSettings<K extends SettingKey>(...keys: K[]): Promise<Pick<Settings, K>> {
  const rows = keys.length ? await db.select().from(settings).where(inArray(settings.key, keys)) : [];
  const out = {} as Pick<Settings, K>;
  for (const k of keys) {
    const stored = rows.find((r) => r.key === k)?.value as object | undefined;
    out[k] = { ...SETTING_DEFAULTS[k], ...(stored ?? {}) } as Settings[K];
  }
  return out;
}

export async function getSetting<K extends SettingKey>(key: K): Promise<Settings[K]> {
  return (await getSettings(key))[key];
}
