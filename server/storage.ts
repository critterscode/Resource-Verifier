
import { db } from "./db";
import {
  resources,
  lists,
  listItems,
  verificationEvents,
  managedTags,
  managedCategories,
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
} from "@shared/schema";
import { eq, ilike, desc, and, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // Resources
  getResources(filters?: { search?: string; category?: string; status?: string; isFavorite?: boolean; limit?: number; offset?: number }): Promise<Resource[]>;
  getResourceCount(filters?: { search?: string; category?: string; status?: string; isFavorite?: boolean }): Promise<number>;
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

  // Lists (formerly collections)
  getLists(): Promise<List[]>;
  getList(id: number): Promise<(List & { resources: Resource[] }) | undefined>;
  createList(list: InsertList): Promise<List>;
  addResourceToList(listId: number, resourceId: number): Promise<void>;
  removeResourceFromList(listId: number, resourceId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // === Resources ===

  private buildResourceConditions(filters?: { search?: string; category?: string; status?: string; isFavorite?: boolean }) {
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
    return conditions;
  }

  async getResources(filters?: { search?: string; category?: string; status?: string; isFavorite?: boolean; limit?: number; offset?: number }): Promise<Resource[]> {
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

  async getResourceCount(filters?: { search?: string; category?: string; status?: string; isFavorite?: boolean }): Promise<number> {
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
}

export const storage = new DatabaseStorage();
