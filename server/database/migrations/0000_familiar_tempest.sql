CREATE TYPE "public"."order_item_type" AS ENUM('PERMIT', 'SHOP_ITEM', 'WORK_DUTY_FEE');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'PAID', 'FULFILLED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"street" text,
	"postal_code" text,
	"city" text,
	"country" text DEFAULT 'Germany',
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"slug" text NOT NULL,
	"work_duties_per_year" integer DEFAULT 0,
	"work_duty_price_in_cents" text,
	"permit_sale_start" text,
	"permit_sale_end" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "club_event" (
	"id" text PRIMARY KEY NOT NULL,
	"club_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"content" text,
	"date_start" timestamp with time zone NOT NULL,
	"date_end" timestamp with time zone,
	"is_work_duty" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "club_event_attendance" (
	"event_id" text NOT NULL,
	"member_id" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "club_event_attendance_event_id_member_id_pk" PRIMARY KEY("event_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "club_member" (
	"id" text PRIMARY KEY NOT NULL,
	"club_id" text NOT NULL,
	"user_id" text,
	"managed_by" text,
	"first_name" text,
	"last_name" text,
	"birth_date" timestamp,
	"phone" text,
	"email" text,
	"street" text,
	"postal_code" text,
	"city" text,
	"country" text DEFAULT 'Germany',
	"preferred_invoicing_method" text DEFAULT 'email' NOT NULL,
	"validation_token" text,
	"validation_token_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "club_member_role" (
	"member_id" text NOT NULL,
	"role_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "club_member_role_member_id_role_id_pk" PRIMARY KEY("member_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "club_role" (
	"id" text PRIMARY KEY NOT NULL,
	"club_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_club_admin" boolean DEFAULT false NOT NULL,
	"is_exempt_from_work_duties" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "club_role_permit_discount" (
	"id" text PRIMARY KEY NOT NULL,
	"club_role_id" text NOT NULL,
	"permit_option_id" text NOT NULL,
	"discount_percent" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "permit" (
	"id" text PRIMARY KEY NOT NULL,
	"club_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "permit_instance" (
	"id" text PRIMARY KEY NOT NULL,
	"permit_option_period_id" text NOT NULL,
	"permit_number" integer NOT NULL,
	"status" text NOT NULL,
	"buyer_id" text,
	"owner_member_id" text,
	"owner_name" text,
	"owner_email" text,
	"owner_phone" text,
	"reserved_by" text,
	"reserved_at" timestamp with time zone,
	"sold_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"payment_reference" text,
	"paid_cents" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "permit_option" (
	"id" text PRIMARY KEY NOT NULL,
	"permit_id" text NOT NULL,
	"name" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "permit_option_period" (
	"id" text PRIMARY KEY NOT NULL,
	"permit_option_id" text NOT NULL,
	"date_start" timestamp with time zone NOT NULL,
	"date_end" timestamp with time zone NOT NULL,
	"price_cents" text NOT NULL,
	"permit_number_start" integer NOT NULL,
	"permit_number_end" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "permit_water" (
	"permit_id" text NOT NULL,
	"water_id" text NOT NULL,
	CONSTRAINT "permit_water_permit_id_water_id_pk" PRIMARY KEY("permit_id","water_id")
);
--> statement-breakpoint
CREATE TABLE "club_order" (
	"id" text PRIMARY KEY NOT NULL,
	"club_id" text NOT NULL,
	"order_number" text NOT NULL,
	"member_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"work_duty_fee_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"shipping_address" jsonb,
	"external_ref" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "club_order_item" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"item_type" "order_item_type" NOT NULL,
	"permit_instance_id" text,
	"shop_item_id" text,
	"name" text NOT NULL,
	"description" text,
	"original_price_cents" integer NOT NULL,
	"discount_percent" integer DEFAULT 0 NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"final_price_cents" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_shop_item" (
	"id" text PRIMARY KEY NOT NULL,
	"club_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"is_standalone" boolean DEFAULT false NOT NULL,
	"auto_add_on_permit_purchase" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "club_water" (
	"club_id" text NOT NULL,
	"water_id" text NOT NULL,
	"validated_at" timestamp with time zone,
	"validated_by" text,
	CONSTRAINT "club_water_club_id_water_id_pk" PRIMARY KEY("club_id","water_id")
);
--> statement-breakpoint
CREATE TABLE "water" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"post_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "water_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club" ADD CONSTRAINT "club_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club" ADD CONSTRAINT "club_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_event" ADD CONSTRAINT "club_event_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_event" ADD CONSTRAINT "club_event_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_event" ADD CONSTRAINT "club_event_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_event_attendance" ADD CONSTRAINT "club_event_attendance_event_id_club_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."club_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_event_attendance" ADD CONSTRAINT "club_event_attendance_member_id_club_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."club_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_event_attendance" ADD CONSTRAINT "club_event_attendance_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_event_attendance" ADD CONSTRAINT "club_event_attendance_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_member" ADD CONSTRAINT "club_member_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_member" ADD CONSTRAINT "club_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_member" ADD CONSTRAINT "club_member_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_member" ADD CONSTRAINT "club_member_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_member_role" ADD CONSTRAINT "club_member_role_member_id_club_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."club_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_member_role" ADD CONSTRAINT "club_member_role_role_id_club_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."club_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_member_role" ADD CONSTRAINT "club_member_role_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_member_role" ADD CONSTRAINT "club_member_role_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_role" ADD CONSTRAINT "club_role_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_role" ADD CONSTRAINT "club_role_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_role" ADD CONSTRAINT "club_role_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_role_permit_discount" ADD CONSTRAINT "club_role_permit_discount_club_role_id_club_role_id_fk" FOREIGN KEY ("club_role_id") REFERENCES "public"."club_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_role_permit_discount" ADD CONSTRAINT "club_role_permit_discount_permit_option_id_permit_option_id_fk" FOREIGN KEY ("permit_option_id") REFERENCES "public"."permit_option"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_role_permit_discount" ADD CONSTRAINT "club_role_permit_discount_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_role_permit_discount" ADD CONSTRAINT "club_role_permit_discount_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit" ADD CONSTRAINT "permit_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit" ADD CONSTRAINT "permit_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit" ADD CONSTRAINT "permit_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit_instance" ADD CONSTRAINT "permit_instance_permit_option_period_id_permit_option_period_id_fk" FOREIGN KEY ("permit_option_period_id") REFERENCES "public"."permit_option_period"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit_instance" ADD CONSTRAINT "permit_instance_buyer_id_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit_instance" ADD CONSTRAINT "permit_instance_owner_member_id_club_member_id_fk" FOREIGN KEY ("owner_member_id") REFERENCES "public"."club_member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit_instance" ADD CONSTRAINT "permit_instance_reserved_by_club_member_id_fk" FOREIGN KEY ("reserved_by") REFERENCES "public"."club_member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit_instance" ADD CONSTRAINT "permit_instance_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit_instance" ADD CONSTRAINT "permit_instance_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit_option" ADD CONSTRAINT "permit_option_permit_id_permit_id_fk" FOREIGN KEY ("permit_id") REFERENCES "public"."permit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit_option" ADD CONSTRAINT "permit_option_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit_option" ADD CONSTRAINT "permit_option_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit_option_period" ADD CONSTRAINT "permit_option_period_permit_option_id_permit_option_id_fk" FOREIGN KEY ("permit_option_id") REFERENCES "public"."permit_option"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit_option_period" ADD CONSTRAINT "permit_option_period_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit_option_period" ADD CONSTRAINT "permit_option_period_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit_water" ADD CONSTRAINT "permit_water_permit_id_permit_id_fk" FOREIGN KEY ("permit_id") REFERENCES "public"."permit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit_water" ADD CONSTRAINT "permit_water_water_id_water_id_fk" FOREIGN KEY ("water_id") REFERENCES "public"."water"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_order" ADD CONSTRAINT "club_order_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_order" ADD CONSTRAINT "club_order_member_id_club_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."club_member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_order" ADD CONSTRAINT "club_order_buyer_id_club_member_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."club_member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_order" ADD CONSTRAINT "club_order_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_order" ADD CONSTRAINT "club_order_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_order_item" ADD CONSTRAINT "club_order_item_order_id_club_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."club_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_order_item" ADD CONSTRAINT "club_order_item_permit_instance_id_permit_instance_id_fk" FOREIGN KEY ("permit_instance_id") REFERENCES "public"."permit_instance"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_order_item" ADD CONSTRAINT "club_order_item_shop_item_id_club_shop_item_id_fk" FOREIGN KEY ("shop_item_id") REFERENCES "public"."club_shop_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_shop_item" ADD CONSTRAINT "club_shop_item_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_shop_item" ADD CONSTRAINT "club_shop_item_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_shop_item" ADD CONSTRAINT "club_shop_item_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_water" ADD CONSTRAINT "club_water_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_water" ADD CONSTRAINT "club_water_water_id_water_id_fk" FOREIGN KEY ("water_id") REFERENCES "public"."water"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_water" ADD CONSTRAINT "club_water_validated_by_user_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "water" ADD CONSTRAINT "water_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "water" ADD CONSTRAINT "water_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "club__slug_idx" ON "club" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "club_member__club_id_idx" ON "club_member" USING btree ("club_id");--> statement-breakpoint
CREATE UNIQUE INDEX "club_member__unique_club_user_idx" ON "club_member" USING btree ("club_id","user_id") WHERE "user_id" is not null;--> statement-breakpoint
CREATE INDEX "club_role__club_id_idx" ON "club_role" USING btree ("club_id");--> statement-breakpoint
CREATE UNIQUE INDEX "club_role__unique_club_name_idx" ON "club_role" USING btree ("club_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "club_role_permit_discount__unique_idx" ON "club_role_permit_discount" USING btree ("club_role_id","permit_option_id");--> statement-breakpoint
CREATE INDEX "club_role_permit_discount__club_role_id_idx" ON "club_role_permit_discount" USING btree ("club_role_id");--> statement-breakpoint
CREATE INDEX "club_role_permit_discount__permit_option_id_idx" ON "club_role_permit_discount" USING btree ("permit_option_id");--> statement-breakpoint
CREATE UNIQUE INDEX "permit_instance__unique_permit_number_idx" ON "permit_instance" USING btree ("permit_option_period_id","permit_number");--> statement-breakpoint
CREATE INDEX "permit_instance__status_idx" ON "permit_instance" USING btree ("status");--> statement-breakpoint
CREATE INDEX "permit_instance__buyer_id_idx" ON "permit_instance" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "permit_instance__owner_member_id_idx" ON "permit_instance" USING btree ("owner_member_id");--> statement-breakpoint
CREATE INDEX "permit_instance__reserved_by_idx" ON "permit_instance" USING btree ("reserved_by");--> statement-breakpoint
CREATE INDEX "permit_option__permit_id_idx" ON "permit_option" USING btree ("permit_id");--> statement-breakpoint
CREATE INDEX "permit_option_period__permit_option_id_idx" ON "permit_option_period" USING btree ("permit_option_id");--> statement-breakpoint
CREATE INDEX "permit_water__water_id_idx" ON "permit_water" USING btree ("water_id");--> statement-breakpoint
CREATE INDEX "club_order__club_id_idx" ON "club_order" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "club_order__member_id_idx" ON "club_order" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "club_order__buyer_id_idx" ON "club_order" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "club_order__status_idx" ON "club_order" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "club_order__club_order_number_idx" ON "club_order" USING btree ("club_id","order_number");--> statement-breakpoint
CREATE INDEX "club_order_item__order_id_idx" ON "club_order_item" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "club_order_item__permit_instance_id_idx" ON "club_order_item" USING btree ("permit_instance_id");--> statement-breakpoint
CREATE INDEX "club_order_item__shop_item_id_idx" ON "club_order_item" USING btree ("shop_item_id");--> statement-breakpoint
CREATE INDEX "club_shop_item__club_id_idx" ON "club_shop_item" USING btree ("club_id");