ALTER TABLE "settings" ADD COLUMN "theme_base" text DEFAULT 'neutral' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "theme_accent" text DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "theme_chart" text DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "theme_mode" text DEFAULT 'system' NOT NULL;