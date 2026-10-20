CREATE TYPE "public"."roles" AS ENUM('admin', 'student', 'owner');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"student_id" text,
	"password_hashed" text,
	"hashing-salt" text,
	"roles" "roles" DEFAULT 'student' NOT NULL,
	"email" text
);
