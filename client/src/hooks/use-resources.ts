import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertResource, UpdateResourceRequest, InsertVerificationEvent } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useResources(filters?: { search?: string; category?: string; status?: "unverified" | "verified" | "needs_info" | "closed" | "limited"; isFavorite?: boolean; tag?: string; limit?: number; offset?: number }) {
  const queryParams: Record<string, any> = { ...filters };
  if (filters?.isFavorite !== undefined) {
    queryParams.isFavorite = String(filters.isFavorite);
  }
  if (filters?.limit !== undefined) {
    queryParams.limit = String(filters.limit);
  }
  if (filters?.offset !== undefined) {
    queryParams.offset = String(filters.offset);
  }

  Object.keys(queryParams).forEach(key => queryParams[key] === undefined && delete queryParams[key]);

  const queryString = new URLSearchParams(queryParams).toString();
  const url = `${api.resources.list.path}${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: [api.resources.list.path, filters],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch resources");
      return res.json();
    },
  });
}

export function useResourceCount(filters?: { search?: string; category?: string; status?: string; isFavorite?: boolean; tag?: string }) {
  const queryParams: Record<string, any> = { ...filters };
  Object.keys(queryParams).forEach(key => queryParams[key] === undefined && delete queryParams[key]);
  const queryString = new URLSearchParams(queryParams).toString();
  const url = `${api.resources.count.path}${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: [api.resources.count.path, filters],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch count");
      const data = await res.json();
      return data.count as number;
    },
  });
}

export function useResource(id: number) {
  return useQuery({
    queryKey: [api.resources.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.resources.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch resource");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: [api.resources.categories.path],
    queryFn: async () => {
      const res = await fetch(api.resources.categories.path);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json() as Promise<string[]>;
    }
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['/api/tags'],
    queryFn: async () => {
      const res = await fetch('/api/tags');
      if (!res.ok) throw new Error("Failed to fetch tags");
      return res.json() as Promise<string[]>;
    }
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertResource) => {
      const res = await fetch(api.resources.create.path, {
        method: api.resources.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
         try {
           const error = await res.json();
           throw new Error(error.message || "Failed to create resource");
         } catch {
           throw new Error("Failed to create resource");
         }
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.resources.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.resources.categories.path] });
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      toast({ title: "Success", description: "Resource created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateResourceRequest }) => {
      const url = buildUrl(api.resources.update.path, { id });
      const res = await fetch(url, {
        method: api.resources.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update resource");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [api.resources.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.resources.get.path, data.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      toast({ title: "Updated", description: "Resource updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.resources.delete.path, { id });
      const res = await fetch(url, { method: api.resources.delete.method });
      if (!res.ok) throw new Error("Failed to delete resource");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.resources.list.path] });
      toast({ title: "Deleted", description: "Resource removed" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useBulkUpdateResources() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: number[]; updates: UpdateResourceRequest }) => {
      const res = await fetch(api.resources.bulkUpdate.path, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, updates }),
      });
      if (!res.ok) throw new Error("Failed to bulk update resources");
      return res.json();
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: [api.resources.list.path] });
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      toast({ title: "Updated", description: `${ids.length} resources updated` });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useVerificationEvents(resourceId: number) {
  return useQuery({
    queryKey: ['/api/resources', resourceId, 'verification-events'],
    queryFn: async () => {
      const res = await fetch(`/api/resources/${resourceId}/verification-events`);
      if (!res.ok) throw new Error("Failed to fetch verification events");
      return res.json();
    },
    enabled: !!resourceId,
  });
}

export function useCreateVerificationEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resourceId, event }: { resourceId: number; event: Omit<InsertVerificationEvent, 'resourceId'> }) => {
      const res = await fetch(`/api/resources/${resourceId}/verification-events`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      if (!res.ok) throw new Error("Failed to create verification event");
      return res.json();
    },
    onSuccess: (_, { resourceId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources', resourceId, 'verification-events'] });
    },
  });
}
