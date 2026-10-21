CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."coupon_type" AS ENUM('percent', 'flat');--> statement-breakpoint
CREATE TYPE "public"."enquiry_status" AS ENUM('new', 'contacted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('new', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('razorpay', 'cod', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'draft', 'out_of_stock');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('owner', 'shop_manager', 'bookings_manager', 'content_editor');--> statement-breakpoint
CREATE TYPE "public"."service_mode" AS ENUM('online', 'onsite', 'both');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('session', 'course', 'webinar', 'workshop');--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"city" varchar(80) NOT NULL,
	"state" varchar(80) NOT NULL,
	"pincode" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"site" varchar(10) NOT NULL,
	"type" varchar(30) NOT NULL,
	"path" text NOT NULL,
	"referrer" text,
	"utm_source" varchar(80),
	"utm_medium" varchar(80),
	"utm_campaign" varchar(120),
	"visitor_id" varchar(40) NOT NULL,
	"device" varchar(10),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer,
	"staff_name" varchar(120) NOT NULL,
	"action" varchar(20) NOT NULL,
	"entity" varchar(40) NOT NULL,
	"entity_id" varchar(60),
	"summary" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"weekday" integer NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocked_dates" (
	"id" serial PRIMARY KEY NOT NULL,
	"day" date NOT NULL,
	"reason" varchar(200),
	CONSTRAINT "blocked_dates_day_unique" UNIQUE("day")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" varchar(30) NOT NULL,
	"service_id" integer,
	"service_name" varchar(200) NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(200) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"mode" varchar(10) NOT NULL,
	"price" numeric(12, 2) DEFAULT 0 NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"razorpay_order_id" varchar(60),
	"razorpay_payment_id" varchar(60),
	"concern" text,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name_en" varchar(120) NOT NULL,
	"name_hi" varchar(120),
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "content_blocks" (
	"key" varchar(120) PRIMARY KEY NOT NULL,
	"site" varchar(10) NOT NULL,
	"section" varchar(60) NOT NULL,
	"label" varchar(160) NOT NULL,
	"kind" varchar(10) DEFAULT 'text' NOT NULL,
	"value_en" text DEFAULT '' NOT NULL,
	"value_hi" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(40) NOT NULL,
	"type" "coupon_type" NOT NULL,
	"value" numeric(12, 2) NOT NULL,
	"min_order" numeric(12, 2) DEFAULT 0 NOT NULL,
	"max_discount" numeric(12, 2),
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"usage_limit" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "course_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" integer NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"timing" varchar(80),
	"location" varchar(160),
	"mode" "service_mode" DEFAULT 'onsite' NOT NULL,
	"seats" integer,
	"fee" numeric(12, 2),
	"note" text
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(200) NOT NULL,
	"phone" varchar(20),
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" varchar(20) NOT NULL,
	"site" varchar(10) DEFAULT 'healing' NOT NULL,
	"service_id" integer,
	"batch_id" integer,
	"name" varchar(120) NOT NULL,
	"email" varchar(200),
	"phone" varchar(20),
	"message" text,
	"status" "enquiry_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_spend" (
	"id" serial PRIMARY KEY NOT NULL,
	"day" date NOT NULL,
	"brand" varchar(20) NOT NULL,
	"channel" varchar(60) NOT NULL,
	"campaign" varchar(160),
	"amount" numeric(12, 2) NOT NULL,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"mime" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"kind" varchar(10) NOT NULL,
	"alt" text,
	"uploaded_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_filename_unique" UNIQUE("filename")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel" varchar(10) NOT NULL,
	"kind" varchar(30) NOT NULL,
	"recipient" varchar(200),
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"link" text,
	"status" varchar(10) DEFAULT 'sent' NOT NULL,
	"error" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer,
	"sku" varchar(60) NOT NULL,
	"name" varchar(200) NOT NULL,
	"hsn_code" varchar(20),
	"unit_price" numeric(12, 2) NOT NULL,
	"qty" integer NOT NULL,
	"gst_percent" numeric(5, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" varchar(30) NOT NULL,
	"customer_id" integer,
	"name" varchar(120) NOT NULL,
	"email" varchar(200) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"shipping_address" jsonb NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"discount" numeric(12, 2) DEFAULT 0 NOT NULL,
	"shipping" numeric(12, 2) DEFAULT 0 NOT NULL,
	"cod_fee" numeric(12, 2) DEFAULT 0 NOT NULL,
	"gst_total" numeric(12, 2) DEFAULT 0 NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"coupon_code" varchar(40),
	"payment_method" "payment_method" NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"status" "order_status" DEFAULT 'new' NOT NULL,
	"razorpay_order_id" varchar(60),
	"razorpay_payment_id" varchar(60),
	"tracking_number" varchar(80),
	"courier" varchar(80),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"sku" varchar(60) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name_en" varchar(200) NOT NULL,
	"name_hi" varchar(200),
	"category_id" integer,
	"crystals" text DEFAULT '' NOT NULL,
	"description_en" text DEFAULT '' NOT NULL,
	"description_hi" text,
	"healing_properties" text DEFAULT '' NOT NULL,
	"chakras" text DEFAULT '' NOT NULL,
	"zodiac" text DEFAULT '' NOT NULL,
	"size" varchar(120),
	"weight_grams" integer,
	"mrp" numeric(12, 2) NOT NULL,
	"sale_price" numeric(12, 2),
	"gst_percent" numeric(5, 2) DEFAULT 3 NOT NULL,
	"hsn_code" varchar(20),
	"stock_qty" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"video" text,
	"rating_avg" numeric(3, 2) DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku"),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"customer_id" integer,
	"name" varchar(120) NOT NULL,
	"rating" integer NOT NULL,
	"title" varchar(200),
	"body" text NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(40) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"type" "service_type" DEFAULT 'session' NOT NULL,
	"name_en" varchar(200) NOT NULL,
	"name_hi" varchar(200),
	"short_en" text DEFAULT '' NOT NULL,
	"short_hi" text,
	"description_en" text DEFAULT '' NOT NULL,
	"description_hi" text,
	"helps_with" text DEFAULT '' NOT NULL,
	"duration_minutes" integer,
	"mode" "service_mode" DEFAULT 'both' NOT NULL,
	"price" numeric(12, 2),
	"trainer_id" integer,
	"bookable_online" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"image" text,
	"video" text,
	"accent" varchar(20) DEFAULT '#9b7fd4' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_code_unique" UNIQUE("code"),
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" varchar(80) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(200) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "staff_role" DEFAULT 'content_editor' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"site" varchar(10) DEFAULT 'healing' NOT NULL,
	"name" varchar(120) NOT NULL,
	"location" varchar(120),
	"text_en" text NOT NULL,
	"text_hi" text,
	"rating" integer DEFAULT 5 NOT NULL,
	"photo" text,
	"service_id" integer,
	"featured" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainers" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(120) NOT NULL,
	"title_en" varchar(200) DEFAULT '' NOT NULL,
	"title_hi" varchar(200),
	"bio_en" text DEFAULT '' NOT NULL,
	"bio_hi" text,
	"credentials" text DEFAULT '' NOT NULL,
	"photo" text,
	"is_founder" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "trainers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "wishlist" (
	"customer_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wishlist_customer_id_product_id_pk" PRIMARY KEY("customer_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_batches" ADD CONSTRAINT "course_batches_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_batch_id_course_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."course_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_spend" ADD CONSTRAINT "marketing_spend_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_staff_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_created_idx" ON "analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "analytics_site_type_idx" ON "analytics_events" USING btree ("site","type");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "bookings_starts_idx" ON "bookings" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "orders_created_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");