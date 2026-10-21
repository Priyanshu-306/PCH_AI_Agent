import "server-only";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import type { StaffUser } from "./auth";

type AuditInput = {
  action: "create" | "update" | "delete" | "import" | "login" | "status" | "export";
  entity: string;
  entityId?: string | number | null;
  summary: string;
  before?: unknown;
  after?: unknown;
};

const IGNORED = new Set(["updatedAt", "createdAt", "passwordHash"]);

/** Keep only the fields that changed so the log stays readable. */
function changed(before: unknown, after: unknown) {
  if (!before || !after || typeof before !== "object" || typeof after !== "object") return { before, after };
  const b: Record<string, unknown> = {};
  const a: Record<string, unknown> = {};
  for (const k of Object.keys(after as object)) {
    if (IGNORED.has(k)) continue;
    const bv = (before as Record<string, unknown>)[k];
    const av = (after as Record<string, unknown>)[k];
    if (JSON.stringify(bv) !== JSON.stringify(av)) {
      b[k] = bv;
      a[k] = av;
    }
  }
  return { before: b, after: a };
}

const strip = (v: unknown) => {
  if (!v || typeof v !== "object") return v ?? null;
  const o = { ...(v as Record<string, unknown>) };
  delete o.passwordHash;
  return o;
};

export async function audit(user: Pick<StaffUser, "id" | "name"> | null, input: AuditInput) {
  const diff = input.action === "update" ? changed(input.before, input.after) : { before: input.before, after: input.after };
  await db.insert(auditLog).values({
    staffId: user?.id ?? null,
    staffName: user?.name ?? "System",
    action: input.action,
    entity: input.entity,
    entityId: input.entityId != null ? String(input.entityId) : null,
    summary: input.summary,
    before: strip(diff.before) ?? null,
    after: strip(diff.after) ?? null,
  });
}
