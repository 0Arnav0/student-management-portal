CREATE SEQUENCE IF NOT EXISTS student_admission_seq START WITH 1;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "activity_action" AS ENUM('CREATE', 'UPDATE', 'DELETE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "auth_event" AS ENUM('LOGIN', 'LOGOUT', 'LOGIN_FAILED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "gender" AS ENUM('MALE', 'FEMALE', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "role" AS ENUM('PRINCIPAL', 'ADMIN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer,
	"action" "activity_action" NOT NULL,
	"details" jsonb,
	"user_id" integer,
	"actor_email" varchar(255),
	"actor_role" "role",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"email" varchar(255) NOT NULL,
	"event" "auth_event" NOT NULL,
	"ip_address" varchar(50),
	"user_agent" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"admission_number" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"course" varchar(100) NOT NULL,
	"year" integer NOT NULL,
	"dob" date NOT NULL,
	"email" varchar(255) NOT NULL,
	"mobile" varchar(15) NOT NULL,
	"gender" "gender" NOT NULL,
	"address" varchar(500) NOT NULL,
	"photo_url" varchar(1000),
	"photo_public_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'ADMIN' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_entity_idx" ON "activity_logs" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_user_id_idx" ON "activity_logs" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_logs_user_id_idx" ON "auth_logs" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_logs_event_idx" ON "auth_logs" ("event");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "students_admission_number_idx" ON "students" ("admission_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "students_name_idx" ON "students" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");