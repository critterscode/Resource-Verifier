
import { pgTable, text, serial, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  address: text("address"),
  services: text("services"),
  hours: text("hours"),
  
  // Status tracking
  status: text("status", { enum: ["unverified", "verified", "missing_info"] }).default("unverified").notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  notes: text("notes"), // For internal notes/missing info details
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const collectionItems = pgTable("collection_items", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").references(() => collections.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
});

// === RELATIONS ===

export const resourcesRelations = relations(resources, ({ many }) => ({
  collectionItems: many(collectionItems),
}));

export const collectionsRelations = relations(collections, ({ many }) => ({
  items: many(collectionItems),
}));

export const collectionItemsRelations = relations(collectionItems, ({ one }) => ({
  collection: one(collections, {
    fields: [collectionItems.collectionId],
    references: [collections.id],
  }),
  resource: one(resources, {
    fields: [collectionItems.resourceId],
    references: [resources.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertResourceSchema = createInsertSchema(resources).omit({ id: true, createdAt: true });
export const insertCollectionSchema = createInsertSchema(collections).omit({ id: true, createdAt: true });
export const insertCollectionItemSchema = createInsertSchema(collectionItems).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type Collection = typeof collections.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;

// Request types
export type CreateResourceRequest = InsertResource;
export type UpdateResourceRequest = Partial<InsertResource>;

// CSV Import Type (loose type for processing uploads)
export type CsvImportRow = Record<string, string>;

// Response types
export type ResourceResponse = Resource;
export type CollectionResponse = Collection & { resourceCount?: number };
