import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  index,
  varchar,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date());
// Money is stored in whole rupees as numeric(12,2) and read back as string by pg.
const money = (name: string) => numeric(name, { precision: 12, scale: 2, mode: "number" });

/* ---------------------------------------------------------------- Staff & customers */

export const roleEnum = pgEnum("staff_role", ["owner", "shop_manager", "bookings_manager", "content_editor"]);

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("content_editor"),
  active: boolean("active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: varchar("city", { length: 80 }).notNull(),
  state: varchar("state", { length: 80 }).notNull(),
  pincode: varchar("pincode", { length: 10 }).notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

/* ---------------------------------------------------------------- Media */

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull().unique(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mime: varchar("mime", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  kind: varchar("kind", { length: 10 }).notNull(), // image | video | file
  alt: text("alt"),
  uploadedBy: integer("uploaded_by").references(() => staff.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

/* ---------------------------------------------------------------- Shop */

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  nameEn: varchar("name_en", { length: 120 }).notNull(),
  nameHi: varchar("name_hi", { length: 120 }),
  sort: integer("sort").notNull().default(0),
});

export const productStatusEnum = pgEnum("product_status", ["active", "draft", "out_of_stock"]);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    sku: varchar("sku", { length: 60 }).notNull().unique(),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    nameEn: varchar("name_en", { length: 200 }).notNull(),
    nameHi: varchar("name_hi", { length: 200 }),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    crystals: text("crystals").notNull().default(""),
    descriptionEn: text("description_en").notNull().default(""),
    descriptionHi: text("description_hi"),
    healingProperties: text("healing_properties").notNull().default(""),
    chakras: text("chakras").notNull().default(""),
    zodiac: text("zodiac").notNull().default(""),
    size: varchar("size", { length: 120 }),
    weightGrams: integer("weight_grams"),
    mrp: money("mrp").notNull(),
    salePrice: money("sale_price"),
    gstPercent: numeric("gst_percent", { precision: 5, scale: 2, mode: "number" }).notNull().default(3),
    hsnCode: varchar("hsn_code", { length: 20 }),
    stockQty: integer("stock_qty").notNull().default(0),
    isFeatured: boolean("is_featured").notNull().default(false),
    status: productStatusEnum("status").notNull().default("draft"),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    video: text("video"),
    ratingAvg: numeric("rating_avg", { precision: 3, scale: 2, mode: "number" }).notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("products_category_idx").on(t.categoryId), index("products_status_idx").on(t.status)],
);

export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "rejected"]);

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  name: varchar("name", { length: 120 }).notNull(),
  rating: integer("rating").notNull(),
  title: varchar("title", { length: 200 }),
  body: text("body").notNull(),
  status: reviewStatusEnum("status").notNull().default("pending"),
  createdAt: createdAt(),
});

export const wishlist = pgTable(
  "wishlist",
  {
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.customerId, t.productId] })],
);

export const couponTypeEnum = pgEnum("coupon_type", ["percent", "flat"]);

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  type: couponTypeEnum("type").notNull(),
  value: money("value").notNull(),
  minOrder: money("min_order").notNull().default(0),
  maxDiscount: money("max_discount"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const paymentMethodEnum = pgEnum("payment_method", ["razorpay", "cod", "whatsapp"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);
export const orderStatusEnum = pgEnum("order_status", [
  "new",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
]);

export type ShippingAddress = {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
};

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    number: varchar("number", { length: 30 }).notNull().unique(),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddress>().notNull(),
    subtotal: money("subtotal").notNull(),
    discount: money("discount").notNull().default(0),
    shipping: money("shipping").notNull().default(0),
    codFee: money("cod_fee").notNull().default(0),
    gstTotal: money("gst_total").notNull().default(0),
    total: money("total").notNull(),
    couponCode: varchar("coupon_code", { length: 40 }),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
    status: orderStatusEnum("status").notNull().default("new"),
    razorpayOrderId: varchar("razorpay_order_id", { length: 60 }),
    razorpayPaymentId: varchar("razorpay_payment_id", { length: 60 }),
    trackingNumber: varchar("tracking_number", { length: 80 }),
    courier: varchar("courier", { length: 80 }),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("orders_created_idx").on(t.createdAt)],
);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  sku: varchar("sku", { length: 60 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  hsnCode: varchar("hsn_code", { length: 20 }),
  unitPrice: money("unit_price").notNull(),
  qty: integer("qty").notNull(),
  gstPercent: numeric("gst_percent", { precision: 5, scale: 2, mode: "number" }).notNull(),
});

/* ---------------------------------------------------------------- Healing */

export const trainers = pgTable("trainers", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  titleEn: varchar("title_en", { length: 200 }).notNull().default(""),
  titleHi: varchar("title_hi", { length: 200 }),
  bioEn: text("bio_en").notNull().default(""),
  bioHi: text("bio_hi"),
  credentials: text("credentials").notNull().default(""),
  photo: text("photo"),
  isFounder: boolean("is_founder").notNull().default(false),
  sort: integer("sort").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const serviceTypeEnum = pgEnum("service_type", ["session", "course", "webinar", "workshop"]);
export const serviceModeEnum = pgEnum("service_mode", ["online", "onsite", "both"]);

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  type: serviceTypeEnum("type").notNull().default("session"),
  nameEn: varchar("name_en", { length: 200 }).notNull(),
  nameHi: varchar("name_hi", { length: 200 }),
  shortEn: text("short_en").notNull().default(""),
  shortHi: text("short_hi"),
  descriptionEn: text("description_en").notNull().default(""),
  descriptionHi: text("description_hi"),
  helpsWith: text("helps_with").notNull().default(""),
  durationMinutes: integer("duration_minutes"),
  mode: serviceModeEnum("mode").notNull().default("both"),
  price: money("price"),
  trainerId: integer("trainer_id").references(() => trainers.id, { onDelete: "set null" }),
  bookableOnline: boolean("bookable_online").notNull().default(true),
  active: boolean("active").notNull().default(true),
  image: text("image"),
  video: text("video"),
  accent: varchar("accent", { length: 20 }).notNull().default("#9b7fd4"),
  sort: integer("sort").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const courseBatches = pgTable("course_batches", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  startsOn: date("starts_on").notNull(),
  endsOn: date("ends_on"),
  timing: varchar("timing", { length: 80 }),
  location: varchar("location", { length: 160 }),
  mode: serviceModeEnum("mode").notNull().default("onsite"),
  seats: integer("seats"),
  fee: money("fee"),
  note: text("note"),
});

// Weekly availability for bookable sessions. weekday: 0 = Sunday … 6 = Saturday.
export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  weekday: integer("weekday").notNull(),
  startTime: varchar("start_time", { length: 5 }).notNull(), // "10:00"
  endTime: varchar("end_time", { length: 5 }).notNull(), // "19:00"
});

export const blockedDates = pgTable("blocked_dates", {
  id: serial("id").primaryKey(),
  day: date("day").notNull().unique(),
  reason: varchar("reason", { length: 200 }),
});

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);

export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    number: varchar("number", { length: 30 }).notNull().unique(),
    serviceId: integer("service_id").references(() => services.id, { onDelete: "set null" }),
    serviceName: varchar("service_name", { length: 200 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    mode: varchar("mode", { length: 10 }).notNull(), // online | onsite
    price: money("price").notNull().default(0),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
    status: bookingStatusEnum("status").notNull().default("pending"),
    razorpayOrderId: varchar("razorpay_order_id", { length: 60 }),
    razorpayPaymentId: varchar("razorpay_payment_id", { length: 60 }),
    concern: text("concern"),
    adminNotes: text("admin_notes"),
    createdAt: createdAt(),
  },
  (t) => [index("bookings_starts_idx").on(t.startsAt)],
);

export const enquiryStatusEnum = pgEnum("enquiry_status", ["new", "contacted", "closed"]);

export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  kind: varchar("kind", { length: 20 }).notNull(), // course | contact | whatsapp_order
  site: varchar("site", { length: 10 }).notNull().default("healing"),
  serviceId: integer("service_id").references(() => services.id, { onDelete: "set null" }),
  batchId: integer("batch_id").references(() => courseBatches.id, { onDelete: "set null" }),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 200 }),
  phone: varchar("phone", { length: 20 }),
  message: text("message"),
  status: enquiryStatusEnum("status").notNull().default("new"),
  createdAt: createdAt(),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  site: varchar("site", { length: 10 }).notNull().default("healing"),
  name: varchar("name", { length: 120 }).notNull(),
  location: varchar("location", { length: 120 }),
  textEn: text("text_en").notNull(),
  textHi: text("text_hi"),
  rating: integer("rating").notNull().default(5),
  photo: text("photo"),
  serviceId: integer("service_id").references(() => services.id, { onDelete: "set null" }),
  featured: boolean("featured").notNull().default(true),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

/* ---------------------------------------------------------------- Content & settings */

// Editable copy/media slots for both sites, keyed like "healing.hero.title".
export const contentBlocks = pgTable("content_blocks", {
  key: varchar("key", { length: 120 }).primaryKey(),
  site: varchar("site", { length: 10 }).notNull(),
  section: varchar("section", { length: 60 }).notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  kind: varchar("kind", { length: 10 }).notNull().default("text"), // text | longtext | image | video | url
  valueEn: text("value_en").notNull().default(""),
  valueHi: text("value_hi"),
  sort: integer("sort").notNull().default(0),
  updatedAt: updatedAt(),
});

export const settings = pgTable("settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: updatedAt(),
});

/* ---------------------------------------------------------------- Marketing, audit, notifications, analytics */

export const marketingSpend = pgTable("marketing_spend", {
  id: serial("id").primaryKey(),
  day: date("day").notNull(),
  brand: varchar("brand", { length: 20 }).notNull(), // healing | shop | both
  channel: varchar("channel", { length: 60 }).notNull(),
  campaign: varchar("campaign", { length: 160 }),
  amount: money("amount").notNull(),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => staff.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    staffId: integer("staff_id").references(() => staff.id, { onDelete: "set null" }),
    staffName: varchar("staff_name", { length: 120 }).notNull(),
    action: varchar("action", { length: 20 }).notNull(), // create | update | delete | import | login | status
    entity: varchar("entity", { length: 40 }).notNull(),
    entityId: varchar("entity_id", { length: 60 }),
    summary: text("summary").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  channel: varchar("channel", { length: 10 }).notNull(), // in_app | email | whatsapp
  kind: varchar("kind", { length: 30 }).notNull(), // order | booking | enquiry | review | stock | system
  recipient: varchar("recipient", { length: 200 }),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  link: text("link"),
  status: varchar("status", { length: 10 }).notNull().default("sent"), // sent | logged | failed
  error: text("error"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: serial("id").primaryKey(),
    site: varchar("site", { length: 10 }).notNull(),
    type: varchar("type", { length: 30 }).notNull(), // page_view | add_to_cart | checkout_start | booking_start
    path: text("path").notNull(),
    referrer: text("referrer"),
    utmSource: varchar("utm_source", { length: 80 }),
    utmMedium: varchar("utm_medium", { length: 80 }),
    utmCampaign: varchar("utm_campaign", { length: 120 }),
    visitorId: varchar("visitor_id", { length: 40 }).notNull(),
    device: varchar("device", { length: 10 }), // mobile | tablet | desktop
    createdAt: createdAt(),
  },
  (t) => [index("analytics_created_idx").on(t.createdAt), index("analytics_site_type_idx").on(t.site, t.type)],
);

