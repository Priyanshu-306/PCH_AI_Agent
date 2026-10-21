export const PERMISSIONS = [
  "dashboard",
  "analytics",
  "products",
  "orders",
  "coupons",
  "reviews",
  "services",
  "bookings",
  "enquiries",
  "trainers",
  "testimonials",
  "content",
  "media",
  "marketing",
  "staff",
  "audit",
  "settings",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
export type Role = "owner" | "shop_manager" | "bookings_manager" | "content_editor";

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  shop_manager: "Shop Manager",
  bookings_manager: "Bookings Manager",
  content_editor: "Content Editor",
};

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: PERMISSIONS,
  shop_manager: ["dashboard", "analytics", "products", "orders", "coupons", "reviews", "media", "marketing"],
  bookings_manager: ["dashboard", "services", "bookings", "enquiries", "trainers", "testimonials"],
  content_editor: ["dashboard", "content", "media", "testimonials", "trainers", "services", "reviews"],
};

export const can = (role: Role, permission: Permission) => ROLE_PERMISSIONS[role].includes(permission);
