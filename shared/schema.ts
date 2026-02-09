
import { pgTable, text, serial, boolean, integer, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),

  // Categories
  category: text("category").notNull(),
  categories: text("categories").array(),

  // Tags (array of tag names - denormalized for speed)
  tags: text("tags").array(),

  // Status
  status: text("status", { enum: ["unverified", "verified", "needs_info", "closed", "limited"] }).default("unverified").notNull(),

  // Location
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  serviceArea: text("service_area"),

  // Contact
  phone: text("phone"),
  email: text("email"),
  website: text("website"),

  // Details
  services: text("services"),
  hours: text("hours"),
  eligibility: text("eligibility"),
  accessInfo: text("access_info"),
  languages: text("languages").array(),

  // Notes
  internalNotes: text("internal_notes"),
  publicNotes: text("public_notes"),

  // Verification / staleness
  confidenceScore: integer("confidence_score").default(20),
  lastVerifiedAt: timestamp("last_verified_at"),
  nextVerifyDueAt: timestamp("next_verify_due_at"),

  // Provider link
  providerId: integer("provider_id"),

  // Legacy fields kept for compatibility
  isFavorite: boolean("is_favorite").default(false).notNull(),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const verificationEvents = pgTable("verification_events", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  performedByUserId: text("performed_by_user_id"),
  performedByRole: text("performed_by_role", { enum: ["staff", "provider", "system"] }).default("staff"),
  method: text("method", { enum: ["website_check", "phone_call", "email", "in_person", "provider_update"] }),
  result: text("result", { enum: ["verified", "needs_info", "closed", "limited", "no_answer"] }),
  fieldsChecked: jsonb("fields_checked"),
  notes: text("notes"),
  receiptId: integer("receipt_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["screenshot", "link", "call_log", "email"] }),
  url: text("url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  orgName: text("org_name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const signalItems = pgTable("signal_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary"),
  type: text("type", { enum: ["closure", "capacity", "policy", "event", "alert", "rumor"] }),
  lane: text("lane", { enum: ["action", "noise"] }).default("noise"),
  impactScore: integer("impact_score").default(0),
  bsScore: integer("bs_score").default(0),
  lastVerifiedAt: timestamp("last_verified_at"),
  sourceReceipts: text("source_receipts").array(),
  relatedResourceIds: integer("related_resource_ids").array(),
  createdByUserId: text("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const updateRequests = pgTable("update_requests", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id),
  submittedBy: text("submitted_by"),
  proposedChanges: jsonb("proposed_changes"),
  notes: text("notes"),
  evidenceLink: text("evidence_link"),
  status: text("status", { enum: ["new", "in_review", "accepted", "rejected"] }).default("new"),
  reviewedByUserId: text("reviewed_by_user_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const managedTags = pgTable("managed_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type"),
  sortOrder: integer("sort_order").default(0),
});

export const managedCategories = pgTable("managed_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color"),
  sortOrder: integer("sort_order").default(0),
});

export const lists = pgTable("lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdByUserId: text("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const listItems = pgTable("list_items", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").references(() => lists.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  sortOrder: integer("sort_order").default(0),
  notes: text("notes"),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const resourcesRelations = relations(resources, ({ many }) => ({
  listItems: many(listItems),
  verificationEvents: many(verificationEvents),
  favorites: many(favorites),
}));

export const listsRelations = relations(lists, ({ many }) => ({
  items: many(listItems),
}));

export const listItemsRelations = relations(listItems, ({ one }) => ({
  list: one(lists, {
    fields: [listItems.listId],
    references: [lists.id],
  }),
  resource: one(resources, {
    fields: [listItems.resourceId],
    references: [resources.id],
  }),
}));

export const verificationEventsRelations = relations(verificationEvents, ({ one }) => ({
  resource: one(resources, {
    fields: [verificationEvents.resourceId],
    references: [resources.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  resource: one(resources, {
    fields: [favorites.resourceId],
    references: [resources.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertResourceSchema = createInsertSchema(resources).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVerificationEventSchema = createInsertSchema(verificationEvents).omit({ id: true, createdAt: true });
export const insertReceiptSchema = createInsertSchema(receipts).omit({ id: true, createdAt: true });
export const insertProviderSchema = createInsertSchema(providers).omit({ id: true, createdAt: true });
export const insertSignalItemSchema = createInsertSchema(signalItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUpdateRequestSchema = createInsertSchema(updateRequests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertManagedTagSchema = createInsertSchema(managedTags).omit({ id: true });
export const insertManagedCategorySchema = createInsertSchema(managedCategories).omit({ id: true });
export const insertListSchema = createInsertSchema(lists).omit({ id: true, createdAt: true, updatedAt: true });
export const insertListItemSchema = createInsertSchema(listItems).omit({ id: true });
export const insertFavoriteSchema = createInsertSchema(favorites).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type VerificationEvent = typeof verificationEvents.$inferSelect;
export type InsertVerificationEvent = z.infer<typeof insertVerificationEventSchema>;

export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;

export type Provider = typeof providers.$inferSelect;
export type InsertProvider = z.infer<typeof insertProviderSchema>;

export type SignalItem = typeof signalItems.$inferSelect;
export type InsertSignalItem = z.infer<typeof insertSignalItemSchema>;

export type UpdateRequest = typeof updateRequests.$inferSelect;
export type InsertUpdateRequest = z.infer<typeof insertUpdateRequestSchema>;

export type ManagedTag = typeof managedTags.$inferSelect;
export type InsertManagedTag = z.infer<typeof insertManagedTagSchema>;

export type ManagedCategory = typeof managedCategories.$inferSelect;
export type InsertManagedCategory = z.infer<typeof insertManagedCategorySchema>;

export type List = typeof lists.$inferSelect;
export type InsertList = z.infer<typeof insertListSchema>;

export type Favorite = typeof favorites.$inferSelect;

// Request types
export type CreateResourceRequest = InsertResource;
export type UpdateResourceRequest = Partial<InsertResource>;

// CSV Import Type
export type CsvImportRow = Record<string, string>;

// Response types
export type ResourceResponse = Resource;
export type ListResponse = List & { resourceCount?: number };
export type VerificationEventResponse = VerificationEvent;
