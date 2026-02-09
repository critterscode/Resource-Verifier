
import { z } from 'zod';
import { insertResourceSchema, insertListSchema, insertVerificationEventSchema, insertManagedTagSchema, insertManagedCategorySchema } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  resources: {
    list: {
      method: 'GET' as const,
      path: '/api/resources' as const,
      input: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        status: z.enum(["unverified", "verified", "needs_info", "closed", "limited"]).optional(),
        isFavorite: z.string().transform(val => val === 'true').optional(),
        limit: z.string().transform(Number).optional(),
        offset: z.string().transform(Number).optional(),
      }).optional(),
    },
    count: {
      method: 'GET' as const,
      path: '/api/resources/count' as const,
    },
    get: {
      method: 'GET' as const,
      path: '/api/resources/:id' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/resources' as const,
      input: insertResourceSchema,
    },
    update: {
      method: 'PUT' as const,
      path: '/api/resources/:id' as const,
      input: insertResourceSchema.partial(),
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/resources/:id' as const,
    },
    bulkUpdate: {
      method: 'PUT' as const,
      path: '/api/resources/bulk' as const,
      input: z.object({
        ids: z.array(z.number()),
        updates: insertResourceSchema.partial(),
      }),
    },
    export: {
      method: 'GET' as const,
      path: '/api/resources/export/csv' as const,
    },
    categories: {
      method: 'GET' as const,
      path: '/api/categories' as const,
    },
    tags: {
      method: 'GET' as const,
      path: '/api/tags' as const,
    },
  },
  verificationEvents: {
    list: {
      method: 'GET' as const,
      path: '/api/resources/:id/verification-events' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/resources/:id/verification-events' as const,
      input: insertVerificationEventSchema.omit({ resourceId: true }),
    },
  },
  managedTags: {
    list: {
      method: 'GET' as const,
      path: '/api/managed-tags' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/managed-tags' as const,
      input: insertManagedTagSchema,
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/managed-tags/:id' as const,
    },
  },
  managedCategories: {
    list: {
      method: 'GET' as const,
      path: '/api/managed-categories' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/managed-categories' as const,
      input: insertManagedCategorySchema,
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/managed-categories/:id' as const,
    },
  },
  lists: {
    list: {
      method: 'GET' as const,
      path: '/api/lists' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/lists' as const,
      input: insertListSchema,
    },
    get: {
      method: 'GET' as const,
      path: '/api/lists/:id' as const,
    },
    addItem: {
      method: 'POST' as const,
      path: '/api/lists/:id/items' as const,
      input: z.object({ resourceId: z.number() }),
    },
    removeItem: {
      method: 'DELETE' as const,
      path: '/api/lists/:id/items/:resourceId' as const,
    },
  },
};

// ============================================
// HELPERS
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
