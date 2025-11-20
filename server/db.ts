import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, conversations, messages, appointments, InsertAppointment } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getConversations(filters?: { startDate?: Date; endDate?: Date; search?: string }) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(conversations);

  if (filters?.startDate || filters?.endDate || filters?.search) {
    const conditions = [];
    if (filters.startDate) conditions.push(gte(conversations.lastMessageAt, filters.startDate));
    if (filters.endDate) conditions.push(lte(conversations.lastMessageAt, filters.endDate));
    if (filters.search) {
      conditions.push(
        sql`(${conversations.clientName} LIKE ${`%${filters.search}%`} OR ${conversations.clientPhone} LIKE ${`%${filters.search}%`})`
      );
    }
    query = query.where(and(...conditions)) as any;
  }

  return query.orderBy(desc(conversations.lastMessageAt));
}

export async function getMessagesByConversation(conversationId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.timestamp);
}

export async function getMetrics(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return { total: 0, client: 0, ai: 0, human: 0 };

  const conditions = [];
  if (startDate) conditions.push(gte(messages.timestamp, startDate));
  if (endDate) conditions.push(lte(messages.timestamp, endDate));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      sender: messages.sender,
      count: sql<number>`count(*)`,
    })
    .from(messages)
    .where(whereClause)
    .groupBy(messages.sender);

  const metrics = { total: 0, client: 0, ai: 0, human: 0 };
  result.forEach((row) => {
    const count = Number(row.count);
    metrics.total += count;
    if (row.sender === "client") metrics.client = count;
    if (row.sender === "ai") metrics.ai = count;
    if (row.sender === "human") metrics.human = count;
  });

  return metrics;
}

export async function getMessagesPerDay(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      date: sql<string>`DATE(${messages.timestamp})`,
      count: sql<number>`count(*)`,
    })
    .from(messages)
    .where(and(gte(messages.timestamp, startDate), lte(messages.timestamp, endDate)))
    .groupBy(sql`DATE(${messages.timestamp})`)
    .orderBy(sql`DATE(${messages.timestamp})`);
}

export async function getAllAppointments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appointments).orderBy(desc(appointments.scheduledAt));
}

export async function createAppointment(data: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(appointments).values(data);
  return result;
}

export async function updateAppointmentStatus(id: number, status: "pending" | "confirmed" | "cancelled" | "completed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(appointments).set({ status }).where(eq(appointments.id, id));
}

export async function deleteAppointment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(appointments).where(eq(appointments.id, id));
}
