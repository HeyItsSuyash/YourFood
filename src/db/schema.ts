import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==========================================
// ENUMS
// ==========================================
export const orgRoleEnum = pgEnum("org_role", [
  "owner",
  "admin",
  "manager",
  "kitchen",
  "waiter",
  "cashier",
  "marketing",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "completed",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "pending",
  "paid",
  "refunded",
  "failed",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash_counter",
  "card_pos",
  "stripe_online",
  "upi_qr",
]);

export const rewardTypeEnum = pgEnum("reward_type", [
  "percent_discount",
  "fixed_discount",
  "free_item",
  "complimentary_upgrade",
]);

// ==========================================
// 1. ORGANIZATIONS (Restaurants / Brands)
// ==========================================
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  brandColor: text("brand_color").default("#E11D48"), // Premium Rose/Ruby accent
  currency: text("currency").default("USD").notNull(),
  taxPercentage: integer("tax_percentage").default(10).notNull(), // e.g., 10%
  serviceChargePercentage: integer("service_charge_percentage").default(5).notNull(), // e.g., 5%
  operatingHours: jsonb("operating_hours").$type<{
    [day: string]: { open: string; close: string; closed: boolean };
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 2. LOCATIONS / BRANCHES
// ==========================================
export const locations = pgTable("locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(), // e.g., "Downtown Branch"
  address: text("address"),
  phone: text("phone"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("locations_org_idx").on(t.orgId),
}));

// ==========================================
// 3. USERS & ORGANIZATION MEMBERSHIPS
// ==========================================
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const memberships = pgTable("memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }), // Optional location assignment
  role: orgRoleEnum("role").default("manager").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userOrgIdx: uniqueIndex("memberships_user_org_idx").on(t.userId, t.orgId),
  orgIdx: index("memberships_org_idx").on(t.orgId),
}));

// ==========================================
// 4. RESTAURANT TABLES & QR CODES
// ==========================================
export const tables = pgTable("tables", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "cascade" }).notNull(),
  tableNumber: text("table_number").notNull(), // e.g. "Table 04" or "Patio 2"
  capacity: integer("capacity").default(4).notNull(),
  qrToken: text("qr_token").notNull().unique(), // Secure unpredictable token
  status: text("status").default("available").notNull(), // "available", "occupied", "reserved"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgLocIdx: index("tables_org_loc_idx").on(t.orgId, t.locationId),
}));

// ==========================================
// 5. MENU CATEGORIES & ITEMS
// ==========================================
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(), // "Starters", "Artisan Pizzas", "Signature Mains", "Beverages"
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("categories_org_idx").on(t.orgId),
}));

export const menuItems = pgTable("menu_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // In cents/minor units (e.g. 1450 = $14.50)
  imageUrl: text("image_url"),
  dietaryLabels: jsonb("dietary_labels").$type<string[]>().default([]), // ["vegan", "gluten-free", "halal", "spicy"]
  prepTimeMinutes: integer("prep_time_minutes").default(15),
  isAvailable: boolean("is_available").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgCatIdx: index("menu_items_org_cat_idx").on(t.orgId, t.categoryId),
}));

// Modifier Groups (e.g. "Choose Crust", "Sauce Level", "Add Truffle")
export const modifierGroups = pgTable("modifier_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  menuItemId: uuid("menu_item_id").references(() => menuItems.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  minSelections: integer("min_selections").default(0).notNull(),
  maxSelections: integer("max_selections").default(1).notNull(),
  isRequired: boolean("is_required").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
}, (t) => ({
  itemIdx: index("modifier_groups_item_idx").on(t.menuItemId),
}));

export const modifierOptions = pgTable("modifier_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  modifierGroupId: uuid("modifier_group_id").references(() => modifierGroups.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  priceDelta: integer("price_delta").default(0).notNull(), // In cents (e.g. +200 = +$2.00)
  isAvailable: boolean("is_available").default(true).notNull(),
});

// ==========================================
// 6. CUSTOMERS & SESSIONS (Anonymous to Identified)
// ==========================================
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  phone: text("phone"),
  email: text("email"),
  name: text("name"),
  consentMarketing: boolean("consent_marketing").default(false).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]), // ["vip", "wine-lover", "regular"]
  totalSpent: integer("total_spent").default(0).notNull(), // In cents
  totalOrders: integer("total_orders").default(0).notNull(),
  lastVisitAt: timestamp("last_visit_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgPhoneIdx: index("customers_org_phone_idx").on(t.orgId, t.phone),
  orgEmailIdx: index("customers_org_email_idx").on(t.orgId, t.email),
}));

export const tableSessions = pgTable("table_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  tableId: uuid("table_id").references(() => tables.id, { onDelete: "cascade" }).notNull(),
  sessionToken: text("session_token").notNull().unique(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
}, (t) => ({
  tableSessionIdx: index("table_sessions_table_idx").on(t.tableId, t.isActive),
}));

// ==========================================
// 7. ORDERS & ITEMS
// ==========================================
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "cascade" }).notNull(),
  tableId: uuid("table_id").references(() => tables.id, { onDelete: "cascade" }).notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  tableSessionId: uuid("table_session_id").references(() => tableSessions.id, { onDelete: "set null" }),
  orderNumber: text("order_number").notNull(), // e.g. "ORD-1042"
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("unpaid").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").default("cash_counter").notNull(),
  subtotal: integer("subtotal").notNull(), // In cents
  taxAmount: integer("tax_amount").default(0).notNull(),
  serviceChargeAmount: integer("service_charge_amount").default(0).notNull(),
  discountAmount: integer("discount_amount").default(0).notNull(),
  totalAmount: integer("total_amount").notNull(), // subtotal + tax + service - discount
  customerNotes: text("customer_notes"),
  idempotencyKey: text("idempotency_key").unique(), // Prevents duplicate orders
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgStatusIdx: index("orders_org_status_idx").on(t.orgId, t.status),
  tableIdx: index("orders_table_idx").on(t.tableId),
  customerIdx: index("orders_customer_idx").on(t.customerId),
}));

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  menuItemId: uuid("menu_item_id").references(() => menuItems.id, { onDelete: "restrict" }).notNull(),
  itemName: text("item_name").notNull(),
  itemPrice: integer("item_price").notNull(), // Price at moment of order
  quantity: integer("quantity").notNull(),
  selectedModifiers: jsonb("selected_modifiers").$type<{
    groupName: string;
    optionName: string;
    priceDelta: number;
  }[]>().default([]),
  itemNotes: text("item_notes"),
  subtotal: integer("subtotal").notNull(), // (itemPrice + sum(modifiers)) * quantity
});

// Service calls (e.g. Call Waiter, Request Bill, Water refill)
export const serviceRequests = pgTable("service_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  tableId: uuid("table_id").references(() => tables.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // "call_waiter", "request_bill", "cutlery", "water"
  note: text("note"),
  status: text("status").default("pending").notNull(), // "pending", "acknowledged", "resolved"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
}, (t) => ({
  orgStatusIdx: index("service_requests_org_status_idx").on(t.orgId, t.status),
}));

// ==========================================
// 8. GAMIFIED PUZZLE LOYALTY & REWARDS
// ==========================================
export const loyaltyCampaigns = pgTable("loyalty_campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(), // "The Master Gourmet Quest"
  description: text("description"),
  artworkTheme: text("artwork_theme").default("culinary_art").notNull(), // Theme for SVG/canvas puzzle rendering
  totalPieces: integer("total_pieces").default(4).notNull(), // 4, 6, or 9 pieces
  minOrderAmount: integer("min_order_amount").default(1500).notNull(), // In cents ($15.00 min to earn piece)
  cooldownHours: integer("cooldown_hours").default(12).notNull(), // Earning frequency limit
  rewardType: rewardTypeEnum("reward_type").default("percent_discount").notNull(),
  rewardValue: integer("reward_value").default(20).notNull(), // e.g. 20 (for 20% off) or 1000 ($10.00 off)
  rewardDescription: text("reward_description").notNull(), // "Enjoy 20% Off Your Entire Feast"
  isActive: boolean("is_active").default(true).notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).defaultNow().notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgActiveIdx: index("loyalty_campaigns_org_active_idx").on(t.orgId, t.isActive),
}));

export const customerPuzzlePieces = pgTable("customer_puzzle_pieces", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  campaignId: uuid("campaign_id").references(() => loyaltyCampaigns.id, { onDelete: "cascade" }).notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  pieceIndex: integer("piece_index").notNull(), // 0 to (totalPieces - 1)
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }), // qualifying order
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  // Ensure a customer cannot earn duplicate piece for the exact same order or pieceIndex in same campaign cycle
  uniquePieceIdx: uniqueIndex("customer_puzzle_unique_piece_idx").on(t.campaignId, t.customerId, t.pieceIndex),
}));

export const customerRewards = pgTable("customer_rewards", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  campaignId: uuid("campaign_id").references(() => loyaltyCampaigns.id, { onDelete: "cascade" }).notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  rewardCode: text("reward_code").notNull().unique(), // e.g. "YF-GOLD-8492"
  rewardType: rewardTypeEnum("reward_type").notNull(),
  rewardValue: integer("reward_value").notNull(),
  title: text("title").notNull(),
  isRedeemed: boolean("is_redeemed").default(false).notNull(),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  redeemedOrderId: uuid("redeemed_order_id").references(() => orders.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  custRewardIdx: index("customer_rewards_cust_idx").on(t.customerId, t.isRedeemed),
}));

// ==========================================
// 9. NOTIFICATIONS & SOUND PREFERENCES
// ==========================================
export const notificationTemplates = pgTable("notification_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  event: text("event").notNull(), // "order_received", "order_confirmed", "order_ready", "puzzle_earned"
  channel: text("channel").default("in_app").notNull(), // "in_app", "sms", "email", "whatsapp"
  titleTemplate: text("title_template").notNull(),
  bodyTemplate: text("body_template").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const notificationDeliveries = pgTable("notification_deliveries", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  recipientType: text("recipient_type").notNull(), // "customer" or "staff"
  recipientId: text("recipient_id"),
  channel: text("channel").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  status: text("status").default("delivered").notNull(), // "delivered", "failed", "pending"
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgDeliveryIdx: index("notification_deliveries_org_idx").on(t.orgId, t.createdAt),
}));

// ==========================================
// 10. CUSTOMER CRM TIMELINE & AUDIT LOGS
// ==========================================
export const customerEvents = pgTable("customer_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  eventType: text("event_type").notNull(), // "qr_scan", "order_placed", "order_completed", "piece_earned", "reward_redeemed"
  title: text("title").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  custEventIdx: index("customer_events_cust_idx").on(t.customerId, t.createdAt),
}));

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // "update_menu", "cancel_order", "create_campaign"
  details: jsonb("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgAuditIdx: index("audit_logs_org_idx").on(t.orgId, t.createdAt),
}));

// Relations setup for Drizzle queries
export const organizationsRelations = relations(organizations, ({ many }) => ({
  locations: many(locations),
  memberships: many(memberships),
  categories: many(categories),
  menuItems: many(menuItems),
  tables: many(tables),
  orders: many(orders),
  customers: many(customers),
  loyaltyCampaigns: many(loyaltyCampaigns),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [categories.orgId],
    references: [organizations.id],
  }),
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
  modifierGroups: many(modifierGroups),
}));

export const modifierGroupsRelations = relations(modifierGroups, ({ one, many }) => ({
  menuItem: one(menuItems, {
    fields: [modifierGroups.menuItemId],
    references: [menuItems.id],
  }),
  options: many(modifierOptions),
}));

export const modifierOptionsRelations = relations(modifierOptions, ({ one }) => ({
  group: one(modifierGroups, {
    fields: [modifierOptions.modifierGroupId],
    references: [modifierGroups.id],
  }),
}));

export const tablesRelations = relations(tables, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [tables.orgId],
    references: [organizations.id],
  }),
  location: one(locations, {
    fields: [tables.locationId],
    references: [locations.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [orders.orgId],
    references: [organizations.id],
  }),
  table: one(tables, {
    fields: [orders.tableId],
    references: [tables.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  puzzlePieces: many(customerPuzzlePieces),
  rewards: many(customerRewards),
  events: many(customerEvents),
}));
