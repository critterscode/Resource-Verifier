import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertCollection } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useCollections() {
  return useQuery({
    queryKey: [api.collections.list.path],
    queryFn: async () => {
      const res = await fetch(api.collections.list.path);
      if (!res.ok) throw new Error("Failed to fetch collections");
      return api.collections.list.responses[200].parse(await res.json());
    },
  });
}

export function useCollection(id: number) {
  return useQuery({
    queryKey: [api.collections.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.collections.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch collection");
      return api.collections.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertCollection) => {
      const res = await fetch(api.collections.create.path, {
        method: api.collections.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create collection");
      return api.collections.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.collections.list.path] });
      toast({ title: "Success", description: "List created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useAddCollectionItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ collectionId, resourceId }: { collectionId: number; resourceId: number }) => {
      const url = buildUrl(api.collections.addItem.path, { id: collectionId });
      const res = await fetch(url, {
        method: api.collections.addItem.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId }),
      });
      if (!res.ok) throw new Error("Failed to add item to list");
    },
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: [api.collections.get.path, collectionId] });
      toast({ title: "Added", description: "Resource added to list" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useRemoveCollectionItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ collectionId, resourceId }: { collectionId: number; resourceId: number }) => {
      const url = buildUrl(api.collections.removeItem.path, { id: collectionId, resourceId });
      const res = await fetch(url, { method: api.collections.removeItem.method });
      if (!res.ok) throw new Error("Failed to remove item");
    },
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: [api.collections.get.path, collectionId] });
      toast({ title: "Removed", description: "Resource removed from list" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}
