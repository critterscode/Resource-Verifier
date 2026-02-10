
import { db } from "./db";
import {
  resources,
  lists,
  listItems,
  verificationEvents,
  managedTags,
  managedCategories,
  signalItems,
  type Resource,
  type InsertResource,
  type UpdateResourceRequest,
  type List,
  type InsertList,
  type VerificationEvent,
  type InsertVerificationEvent,
  type ManagedTag,
  type InsertManagedTag,
  type ManagedCategory,
  type InsertManagedCategory,
  type SignalItem,
  type InsertSignalItem,
} from "@shared/schema";
import { eq, ilike, desc, and, inArray, sql, ne } from "drizzle-orm";

export interface IStorage {
  // Resources
  getResources(filters?: { search?: string; category?: string; status?: string; isFavorite?: boolean; tag?: string; limit?: number; offset?: number }): Promise<Resource[]>;
  getResourceCount(filters?: { search?: string; category?: string; status?: string; isFavorite?: boolean; tag?: string }): Promise<number>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, updates: UpdateResourceRequest): Promise<Resource>;
  deleteResource(id: number): Promise<void>;
  bulkUpdateResources(ids: number[], updates: UpdateResourceRequest): Promise<Resource[]>;

  // Categories (from resource data)
  getAllCategories(): Promise<string[]>;

  // Tags (from resource data)
  getAllTags(): Promise<string[]>;

  // Managed Tags
  getManagedTags(): Promise<ManagedTag[]>;
  createManagedTag(tag: InsertManagedTag): Promise<ManagedTag>;
  deleteManagedTag(id: number): Promise<void>;

  // Managed Categories
  getManagedCategories(): Promise<ManagedCategory[]>;
  createManagedCategory(cat: InsertManagedCategory): Promise<ManagedCategory>;
  deleteManagedCategory(id: number): Promise<void>;

  // Verification Events
  getVerificationEvents(resourceId: number): Promise<VerificationEvent[]>;
  createVerificationEvent(event: InsertVerificationEvent): Promise<VerificationEvent>;

  // Public API
  getPublicResources(filters?: { search?: string; category?: string; tag?: string; limit?: number; offset?: number }): Promise<Partial<Resource>[]>;
  getPublicResourceCount(filters?: { search?: string; category?: string; tag?: string }): Promise<number>;
  getPublicResource(id: number): Promise<Partial<Resource> | undefined>;

  // Lists (formerly collections)
  getLists(): Promise<List[]>;
  getList(id: number): Promise<(List & { resources: Resource[] }) | undefined>;
  createList(list: InsertList): Promise<List>;
  addResourceToList(listId: number, resourceId: number): Promise<void>;
  removeResourceFromList(listId: number, resourceId: number): Promise<void>;

  // Signal Items
  getSignalItems(filters?: { type?: string; lane?: string; search?: string; limit?: number; offset?: number }): Promise<SignalItem[]>;
  getSignalItemCount(filters?: { type?: string; lane?: string; search?: string }): Promise<number>;
  getSignalItem(id: number): Promise<SignalItem | undefined>;
  createSignalItem(item: InsertSignalItem): Promise<SignalItem>;
  updateSignalItem(id: number, updates: Partial<InsertSignalItem>): Promise<SignalItem>;
  deleteSignalItem(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // === Resources ===

  private buildResourceConditions(filters?: { search?: string; category?: string; status?: string; isFavorite?: boolean; tag?: string }) {
    const conditions = [];
    if (filters?.search) {
      conditions.push(ilike(resources.name, `%${filters.search}%`));
    }
    if (filters?.category) {
      conditions.push(eq(resources.category, filters.category));
    }
    if (filters?.status) {
      conditions.push(eq(resources.status, filters.status as any));
    }
    if (filters?.isFavorite !== undefined) {
      conditions.push(eq(resources.isFavorite, filters.isFavorite));
    }
    if (filters?.tag) {
      conditions.push(sql`${resources.tags} @> ARRAY[${filters.tag}]::text[]`);
    }
    return conditions;
  }

  async getResources(filters?: { search?: string; category?: string; status?: string; isFavorite?: boolean; tag?: string; limit?: number; offset?: number }): Promise<Resource[]> {
    const conditions = this.buildResourceConditions(filters);

    let query = db.select()
      .from(resources)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(resources.name);

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    return await query;
  }

  async getResourceCount(filters?: { search?: string; category?: string; status?: string; isFavorite?: boolean; tag?: string }): Promise<number> {
    const conditions = this.buildResourceConditions(filters);
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(resources)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return result[0]?.count ?? 0;
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }

  async updateResource(id: number, updates: UpdateResourceRequest): Promise<Resource> {
    const [updated] = await db.update(resources)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(resources.id, id))
      .returning();
    return updated;
  }

  async deleteResource(id: number): Promise<void> {
    await db.delete(listItems).where(eq(listItems.resourceId, id));
    await db.delete(verificationEvents).where(eq(verificationEvents.resourceId, id));
    await db.delete(resources).where(eq(resources.id, id));
  }

  async bulkUpdateResources(ids: number[], updates: UpdateResourceRequest): Promise<Resource[]> {
    const updated = await db.update(resources)
      .set({ ...updates, updatedAt: new Date() })
      .where(inArray(resources.id, ids))
      .returning();
    return updated;
  }

  // === Categories (from resource data) ===

  async getAllCategories(): Promise<string[]> {
    const result = await db.selectDistinct({ category: resources.category }).from(resources);
    const resultMulti = await db.select({ categories: resources.categories }).from(resources);

    const all = new Set<string>();
    result.forEach(r => { if (r.category) all.add(r.category); });
    resultMulti.forEach(r => {
      if (r.categories) r.categories.forEach(c => all.add(c));
    });

    return Array.from(all).sort();
  }

  // === Tags (from resource data) ===

  async getAllTags(): Promise<string[]> {
    const result = await db.select({ tags: resources.tags }).from(resources);
    const all = new Set<string>();
    result.forEach(r => {
      if (r.tags) r.tags.forEach(t => all.add(t));
    });
    return Array.from(all).sort();
  }

  // === Managed Tags ===

  async getManagedTags(): Promise<ManagedTag[]> {
    return await db.select().from(managedTags).orderBy(managedTags.sortOrder, managedTags.name);
  }

  async createManagedTag(tag: InsertManagedTag): Promise<ManagedTag> {
    const [newTag] = await db.insert(managedTags).values(tag).returning();
    return newTag;
  }

  async deleteManagedTag(id: number): Promise<void> {
    await db.delete(managedTags).where(eq(managedTags.id, id));
  }

  // === Managed Categories ===

  async getManagedCategories(): Promise<ManagedCategory[]> {
    return await db.select().from(managedCategories).orderBy(managedCategories.sortOrder, managedCategories.name);
  }

  async createManagedCategory(cat: InsertManagedCategory): Promise<ManagedCategory> {
    const [newCat] = await db.insert(managedCategories).values(cat).returning();
    return newCat;
  }

  async deleteManagedCategory(id: number): Promise<void> {
    await db.delete(managedCategories).where(eq(managedCategories.id, id));
  }

  // === Verification Events ===

  async getVerificationEvents(resourceId: number): Promise<VerificationEvent[]> {
    return await db.select()
      .from(verificationEvents)
      .where(eq(verificationEvents.resourceId, resourceId))
      .orderBy(desc(verificationEvents.createdAt));
  }

  async createVerificationEvent(event: InsertVerificationEvent): Promise<VerificationEvent> {
    const [newEvent] = await db.insert(verificationEvents).values(event).returning();
    return newEvent;
  }

  // === Public API ===

  private publicColumns = {
    id: resources.id,
    name: resources.name,
    description: resources.description,
    category: resources.category,
    categories: resources.categories,
    tags: resources.tags,
    status: resources.status,
    address: resources.address,
    city: resources.city,
    state: resources.state,
    zip: resources.zip,
    lat: resources.lat,
    lng: resources.lng,
    serviceArea: resources.serviceArea,
    phone: resources.phone,
    email: resources.email,
    website: resources.website,
    services: resources.services,
    hours: resources.hours,
    eligibility: resources.eligibility,
    accessInfo: resources.accessInfo,
    languages: resources.languages,
    publicNotes: resources.publicNotes,
    confidenceScore: resources.confidenceScore,
    lastVerifiedAt: resources.lastVerifiedAt,
  };

  private buildPublicConditions(filters?: { search?: string; category?: string; tag?: string }) {
    const conditions = [ne(resources.status, "closed")];
    if (filters?.search) {
      conditions.push(ilike(resources.name, `%${filters.search}%`));
    }
    if (filters?.category) {
      conditions.push(eq(resources.category, filters.category));
    }
    if (filters?.tag) {
      conditions.push(sql`${resources.tags} @> ARRAY[${filters.tag}]::text[]`);
    }
    return conditions;
  }

  async getPublicResources(filters?: { search?: string; category?: string; tag?: string; limit?: number; offset?: number }): Promise<Partial<Resource>[]> {
    const conditions = this.buildPublicConditions(filters);
    let query = db.select(this.publicColumns)
      .from(resources)
      .where(and(...conditions))
      .orderBy(resources.name);

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    return await query;
  }

  async getPublicResourceCount(filters?: { search?: string; category?: string; tag?: string }): Promise<number> {
    const conditions = this.buildPublicConditions(filters);
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(resources)
      .where(and(...conditions));
    return result[0]?.count ?? 0;
  }

  async getPublicResource(id: number): Promise<Partial<Resource> | undefined> {
    const [resource] = await db.select(this.publicColumns)
      .from(resources)
      .where(and(eq(resources.id, id), ne(resources.status, "closed")));
    return resource;
  }

  // === Lists (formerly collections) ===

  async getLists(): Promise<List[]> {
    return await db.select().from(lists).orderBy(desc(lists.createdAt));
  }

  async getList(id: number): Promise<(List & { resources: Resource[] }) | undefined> {
    const [list] = await db.select().from(lists).where(eq(lists.id, id));

    if (!list) return undefined;

    const items = await db.select({
      resource: resources
    })
    .from(listItems)
    .innerJoin(resources, eq(listItems.resourceId, resources.id))
    .where(eq(listItems.listId, id));

    return {
      ...list,
      resources: items.map(i => i.resource)
    };
  }

  async createList(list: InsertList): Promise<List> {
    const [newList] = await db.insert(lists).values(list).returning();
    return newList;
  }

  async addResourceToList(listId: number, resourceId: number): Promise<void> {
    const existing = await db.select()
      .from(listItems)
      .where(and(
        eq(listItems.listId, listId),
        eq(listItems.resourceId, resourceId)
      ));

    if (existing.length === 0) {
      await db.insert(listItems).values({ listId, resourceId });
    }
  }

  async removeResourceFromList(listId: number, resourceId: number): Promise<void> {
    await db.delete(listItems)
      .where(and(
        eq(listItems.listId, listId),
        eq(listItems.resourceId, resourceId)
      ));
  }

  // === Signal Items ===

  private buildSignalConditions(filters?: { type?: string; lane?: string; search?: string }) {
    const conditions = [];
    if (filters?.type) {
      conditions.push(eq(signalItems.type, filters.type as any));
    }
    if (filters?.lane) {
      conditions.push(eq(signalItems.lane, filters.lane as any));
    }
    if (filters?.search) {
      conditions.push(ilike(signalItems.title, `%${filters.search}%`));
    }
    return conditions;
  }

  async getSignalItems(filters?: { type?: string; lane?: string; search?: string; limit?: number; offset?: number }): Promise<SignalItem[]> {
    const conditions = this.buildSignalConditions(filters);
    let query = db.select()
      .from(signalItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(signalItems.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    return await query;
  }

  async getSignalItemCount(filters?: { type?: string; lane?: string; search?: string }): Promise<number> {
    const conditions = this.buildSignalConditions(filters);
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(signalItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return result[0]?.count ?? 0;
  }

  async getSignalItem(id: number): Promise<SignalItem | undefined> {
    const [item] = await db.select().from(signalItems).where(eq(signalItems.id, id));
    return item;
  }

  async createSignalItem(item: InsertSignalItem): Promise<SignalItem> {
    const [newItem] = await db.insert(signalItems).values(item).returning();
    return newItem;
  }

  async updateSignalItem(id: number, updates: Partial<InsertSignalItem>): Promise<SignalItem> {
    const [updated] = await db.update(signalItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(signalItems.id, id))
      .returning();
    return updated;
  }

  async deleteSignalItem(id: number): Promise<void> {
    await db.delete(signalItems).where(eq(signalItems.id, id));
  }
}

export const storage = new DatabaseStorage();
