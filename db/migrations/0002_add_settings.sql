CREATE TABLE "settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"theme_base" text DEFAULT 'neutral' NOT NULL,
	"theme_accent" text DEFAULT 'default' NOT NULL,
	"theme_chart" text DEFAULT 'default' NOT NULL,
	"theme_mode" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_users_auth_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("auth_id") ON DELETE cascade ON UPDATE no action;