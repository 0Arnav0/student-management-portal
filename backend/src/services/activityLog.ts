import { activityLogs } from "../db/schema.js";

export interface ActorInfo {
  id: number;
  email: string;
  role: "PRINCIPAL" | "ADMIN";
}

interface LogActivityPayload {
  entityType?: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entityId?: number;
  details?: any;
  actor?: ActorInfo | null;
}

export async function logActivity(
  client: any,
  payload: LogActivityPayload
): Promise<void> {
  const { entityType = "Student", action, entityId, details, actor } = payload;
  
  await client.insert(activityLogs).values({
    entityType,
    action,
    entityId,
    details: details ? JSON.stringify(details) : null,
    userId: actor?.id ?? null,
    actorEmail: actor?.email ?? null,
    actorRole: actor?.role ?? null,
  });
}
