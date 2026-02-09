import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertList } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useCollections() {
  return useQuery({
    queryKey: [api.lists.list.path],
    queryFn: async () => {
      const res = await fetch(api.lists.list.path);
      if (!res.ok) throw new Error("Failed to fetch lists");
      return res.json();
    },
  });
}

export function useCollection(id: number) {
  return useQuery({
    queryKey: [api.lists.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.lists.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch list");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertList) => {
      const res = await fetch(api.lists.create.path, {
        method: api.lists.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create list");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.lists.list.path] });
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
      const url = buildUrl(api.lists.addItem.path, { id: collectionId });
      const res = await fetch(url, {
        method: api.lists.addItem.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId }),
      });
      if (!res.ok) throw new Error("Failed to add item to list");
    },
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: [api.lists.get.path, collectionId] });
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
      const url = buildUrl(api.lists.removeItem.path, { id: collectionId, resourceId });
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to remove item");
    },
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: [api.lists.get.path, collectionId] });
      toast({ title: "Removed", description: "Resource removed from list" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}
