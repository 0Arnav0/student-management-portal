import { pgTable, serial, varchar, integer, timestamp, boolean, jsonb, pgEnum, index, uniqueIndex, date } from "drizzle-orm/pg-core";

// Define PostgreSQL Enums to match original schema
export const genderEnum = pgEnum("gender", ["MALE", "FEMALE", "OTHER"]);
export const roleEnum = pgEnum("role", ["PRINCIPAL", "ADMIN"]);
export const activityActionEnum = pgEnum("activity_action", ["CREATE", "UPDATE", "DELETE"]);
export const authEventEnum = pgEnum("auth_event", ["LOGIN", "LOGOUT", "LOGIN_FAILED"]);

// Students Table
export const students = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    admissionNumber: varchar("admission_number", { length: 50 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    course: varchar("course", { length: 100 }).notNull(),
    year: integer("year").notNull(),
    dob: date("dob").notNull(), // date type in Postgres corresponds to YYYY-MM-DD
    email: varchar("email", { length: 255 }).notNull(),
    mobile: varchar("mobile", { length: 15 }).notNull(),
    gender: genderEnum("gender").notNull(),
    address: varchar("address", { length: 500 }).notNull(),
    photoUrl: varchar("photo_url", { length: 1000 }),
    photoPublicId: varchar("photo_public_id", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      admissionNumberIdx: uniqueIndex("students_admission_number_idx").on(table.admissionNumber),
      nameIdx: index("students_name_idx").on(table.name),
    };
  }
);

// Users Table (Staff Accounts)
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: roleEnum("role").default("ADMIN").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      emailIdx: uniqueIndex("users_email_idx").on(table.email),
    };
  }
);

// Activity Logs Table
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: serial("id").primaryKey(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: integer("entity_id"),
    action: activityActionEnum("action").notNull(),
    details: jsonb("details"),
    userId: integer("user_id"),
    actorEmail: varchar("actor_email", { length: 255 }),
    actorRole: roleEnum("actor_role"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      entityIdx: index("activity_logs_entity_idx").on(table.entityType, table.entityId),
      userIdIdx: index("activity_logs_user_id_idx").on(table.userId),
    };
  }
);

// Auth Logs Table
export const authLogs = pgTable(
  "auth_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    email: varchar("email", { length: 255 }).notNull(),
    event: authEventEnum("event").notNull(),
    ipAddress: varchar("ip_address", { length: 50 }),
    userAgent: varchar("user_agent", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index("auth_logs_user_id_idx").on(table.userId),
      eventIdx: index("auth_logs_event_idx").on(table.event),
    };
  }
);
