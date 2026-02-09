
import { db } from "./db";
import {
  resources,
  collections,
  collectionItems,
  type Resource,
  type InsertResource,
  type UpdateResourceRequest,
  type Collection,
  type InsertCollection,
  type ResourceResponse
} from "@shared/schema";
import { eq, ilike, desc, and } from "drizzle-orm";

export interface IStorage {
  // Resources
  getResources(filters?: { search?: string; category?: string; status?: string; isFavorite?: boolean }): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, updates: UpdateResourceRequest): Promise<Resource>;
  deleteResource(id: number): Promise<void>;
  getAllCategories(): Promise<string[]>;

  // Collections
  getCollections(): Promise<Collection[]>;
  getCollection(id: number): Promise<(Collection & { resources: Resource[] }) | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  addResourceToCollection(collectionId: number, resourceId: number): Promise<void>;
  removeResourceFromCollection(collectionId: number, resourceId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getResources(filters?: { search?: string; category?: string; status?: string; isFavorite?: boolean }): Promise<Resource[]> {
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

    return await db.select()
      .from(resources)
      .where(and(...conditions))
      .orderBy(resources.name);
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
      .set(updates)
      .where(eq(resources.id, id))
      .returning();
    return updated;
  }

  async deleteResource(id: number): Promise<void> {
    await db.delete(resources).where(eq(resources.id, id));
  }

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

  async getAllTags(): Promise<string[]> {
    const result = await db.select({ tags: resources.tags }).from(resources);
    const all = new Set<string>();
    result.forEach(r => {
      if (r.tags) r.tags.forEach(t => all.add(t));
    });
    return Array.from(all).sort();
  }

  // Collections
  async getCollections(): Promise<Collection[]> {
    return await db.select().from(collections).orderBy(desc(collections.createdAt));
  }

  async getCollection(id: number): Promise<(Collection & { resources: Resource[] }) | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    
    if (!collection) return undefined;

    const items = await db.select({
      resource: resources
    })
    .from(collectionItems)
    .innerJoin(resources, eq(collectionItems.resourceId, resources.id))
    .where(eq(collectionItems.collectionId, id));

    return {
      ...collection,
      resources: items.map(i => i.resource)
    };
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const [newCollection] = await db.insert(collections).values(collection).returning();
    return newCollection;
  }

  async addResourceToCollection(collectionId: number, resourceId: number): Promise<void> {
    // Check if exists
    const existing = await db.select()
      .from(collectionItems)
      .where(and(
        eq(collectionItems.collectionId, collectionId),
        eq(collectionItems.resourceId, resourceId)
      ));
      
    if (existing.length === 0) {
      await db.insert(collectionItems).values({ collectionId, resourceId });
    }
  }

  async removeResourceFromCollection(collectionId: number, resourceId: number): Promise<void> {
    await db.delete(collectionItems)
      .where(and(
        eq(collectionItems.collectionId, collectionId),
        eq(collectionItems.resourceId, resourceId)
      ));
  }
}

export const storage = new DatabaseStorage();
