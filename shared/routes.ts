
import { z } from 'zod';
import { insertResourceSchema, insertCollectionSchema, resources, collections, collectionItems } from './schema';

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
        status: z.enum(["unverified", "verified", "missing_info"]).optional(),
        isFavorite: z.string().transform(val => val === 'true').optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof resources.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/resources/:id' as const,
      responses: {
        200: z.custom<typeof resources.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/resources' as const,
      input: insertResourceSchema,
      responses: {
        201: z.custom<typeof resources.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/resources/:id' as const,
      input: insertResourceSchema.partial(),
      responses: {
        200: z.custom<typeof resources.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/resources/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    export: {
      method: 'GET' as const,
      path: '/api/resources/export/csv' as const,
      responses: {
        200: z.string(), // Returns CSV string
      },
    },
    categories: {
      method: 'GET' as const,
      path: '/api/categories' as const,
      responses: {
        200: z.array(z.string()),
      }
    }
  },
  collections: {
    list: {
      method: 'GET' as const,
      path: '/api/collections' as const,
      responses: {
        200: z.array(z.custom<typeof collections.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/collections' as const,
      input: insertCollectionSchema,
      responses: {
        201: z.custom<typeof collections.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/collections/:id' as const,
      responses: {
        200: z.custom<typeof collections.$inferSelect & { resources: typeof resources.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    addItem: {
      method: 'POST' as const,
      path: '/api/collections/:id/items' as const,
      input: z.object({ resourceId: z.number() }),
      responses: {
        201: z.void(),
        404: errorSchemas.notFound,
      },
    },
    removeItem: {
      method: 'DELETE' as const,
      path: '/api/collections/:id/items/:resourceId' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  }
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
