
import { z } from 'zod';
import { insertResourceSchema, insertListSchema, insertVerificationEventSchema, insertManagedTagSchema, insertManagedCategorySchema, insertSignalItemSchema, insertUpdateRequestSchema, insertProviderSchema } from './schema';

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
  public: {
    resources: {
      method: 'GET' as const,
      path: '/api/public/resources' as const,
    },
    count: {
      method: 'GET' as const,
      path: '/api/public/resources/count' as const,
    },
    get: {
      method: 'GET' as const,
      path: '/api/public/resources/:id' as const,
    },
    categories: {
      method: 'GET' as const,
      path: '/api/public/categories' as const,
    },
  },
  signals: {
    list: {
      method: 'GET' as const,
      path: '/api/signals' as const,
      input: z.object({
        type: z.enum(["closure", "capacity", "policy", "event", "alert", "rumor"]).optional(),
        lane: z.enum(["action", "noise"]).optional(),
        search: z.string().optional(),
        limit: z.string().transform(Number).optional(),
        offset: z.string().transform(Number).optional(),
      }).optional(),
    },
    count: {
      method: 'GET' as const,
      path: '/api/signals/count' as const,
    },
    get: {
      method: 'GET' as const,
      path: '/api/signals/:id' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/signals' as const,
      input: insertSignalItemSchema,
    },
    update: {
      method: 'PUT' as const,
      path: '/api/signals/:id' as const,
      input: insertSignalItemSchema.partial(),
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/signals/:id' as const,
    },
  },
  providers: {
    lookup: {
      method: 'POST' as const,
      path: '/api/providers/lookup' as const,
      input: z.object({ email: z.string().email() }),
    },
    register: {
      method: 'POST' as const,
      path: '/api/providers/register' as const,
      input: insertProviderSchema,
    },
    resources: {
      method: 'GET' as const,
      path: '/api/providers/:id/resources' as const,
    },
    updateRequests: {
      method: 'GET' as const,
      path: '/api/providers/:id/update-requests' as const,
    },
  },
  updateRequests: {
    list: {
      method: 'GET' as const,
      path: '/api/update-requests' as const,
      input: z.object({
        status: z.enum(["new", "in_review", "accepted", "rejected"]).optional(),
        limit: z.string().transform(Number).optional(),
        offset: z.string().transform(Number).optional(),
      }).optional(),
    },
    count: {
      method: 'GET' as const,
      path: '/api/update-requests/count' as const,
    },
    get: {
      method: 'GET' as const,
      path: '/api/update-requests/:id' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/update-requests' as const,
      input: insertUpdateRequestSchema,
    },
    accept: {
      method: 'POST' as const,
      path: '/api/update-requests/:id/accept' as const,
    },
    reject: {
      method: 'POST' as const,
      path: '/api/update-requests/:id/reject' as const,
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
