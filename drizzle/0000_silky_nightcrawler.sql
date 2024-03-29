CREATE TABLE IF NOT EXISTS "tokens" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tokens_id_idx" ON "tokens" ("id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_id_idx" ON "users" ("id");

INSERT INTO "users" ("id", "created_at", "updated_at") VALUES ('04319e04-08d4-452f-9a46-9c1f9e79e2f0', '2022-08-18 11:58:05.698', '2022-08-18 11:58:05.699');