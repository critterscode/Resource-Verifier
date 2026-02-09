import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateResourceRequest, type UpdateResourceRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useResources(filters?: { search?: string; category?: string; status?: "unverified" | "verified" | "missing_info"; isFavorite?: boolean }) {
  // Convert boolean isFavorite to string 'true'/'false' for the API schema validation if needed,
  // or pass as is if the schema handles it. The schema expects string 'true' for transformation.
  const queryParams: Record<string, any> = { ...filters };
  if (filters?.isFavorite !== undefined) {
    queryParams.isFavorite = String(filters.isFavorite);
  }

  // Remove undefined keys
  Object.keys(queryParams).forEach(key => queryParams[key] === undefined && delete queryParams[key]);

  const queryString = new URLSearchParams(queryParams).toString();
  const url = `${api.resources.list.path}${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: [api.resources.list.path, filters],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch resources");
      return api.resources.list.responses[200].parse(await res.json());
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
      return api.resources.get.responses[200].parse(await res.json());
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
      return api.resources.categories.responses[200].parse(await res.json());
    }
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateResourceRequest) => {
      const res = await fetch(api.resources.create.path, {
        method: api.resources.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
         // Try to parse validation error
         try {
           const error = await res.json();
           throw new Error(error.message || "Failed to create resource");
         } catch (e) {
           throw new Error("Failed to create resource");
         }
      }
      return api.resources.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.resources.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.resources.categories.path] });
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
      return api.resources.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.resources.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.resources.get.path, data.id] });
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
