import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertResource, UpdateResourceRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useResources(filters?: { search?: string; category?: string; status?: "unverified" | "verified" | "missing_info"; isFavorite?: boolean }) {
  const queryParams: Record<string, any> = { ...filters };
  if (filters?.isFavorite !== undefined) {
    queryParams.isFavorite = String(filters.isFavorite);
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
