import "server-only";
import { db } from "@/db";
import { auditLog } from "@/db/schema";

export async function audit(actorId: string | null, action: string, targetType?: string, targetId?: string, meta?: Record<string, unknown>) {
  await db.insert(auditLog).values({ actorId, action, targetType, targetId, meta });
}
