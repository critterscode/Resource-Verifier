import { useState } from "react";
import { useResources, useCreateResource, useUpdateResource, useCategories } from "@/hooks/use-resources";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  Star,
  Edit,
  Trash2,
  Phone,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResourceForm } from "@/components/ResourceForm";
import type { Resource } from "@shared/routes";
import { api } from "@shared/routes";

export default function Resources() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const { data: resources, isLoading } = useResources({
    search: search || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    status: statusFilter !== "all" ? statusFilter as any : undefined,
  });

  const { data: categories } = useCategories();
  const createMutation = useCreateResource();
  const updateMutation = useUpdateResource();

  const handleCreate = async (data: any) => {
    await createMutation.mutateAsync(data);
    setIsCreateOpen(false);
  };

  const handleUpdate = async (data: any) => {
    if (!editingResource) return;
    await updateMutation.mutateAsync({ id: editingResource.id, updates: data });
    setEditingResource(null);
  };

  const toggleFavorite = (resource: Resource) => {
    updateMutation.mutate({ 
      id: resource.id, 
      updates: { isFavorite: !resource.isFavorite } 
    });
  };

  const handleExport = () => {
    window.location.href = api.resources.export.path;
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Resources</h1>
          <p className="text-muted-foreground">Manage and verify community resources.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Resource</DialogTitle>
              </DialogHeader>
              <ResourceForm 
                onSubmit={handleCreate} 
                isSubmitting={createMutation.isPending} 
                onCancel={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, services, phone..." 
            className="pl-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                 <Filter className="w-4 h-4 text-muted-foreground" />
                 <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="missing_info">Missing Info</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resource Grid */}
      <div className="flex-1 overflow-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border sticky top-0 backdrop-blur-sm z-10">
            <tr>
              <th className="px-6 py-4 w-[40%]">Name & Description</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
               // Loading Skeletons
               Array.from({ length: 5 }).map((_, i) => (
                 <tr key={i}>
                   <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                   <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                   <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                   <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                   <td className="px-6 py-4"><Skeleton className="h-8 w-8 ml-auto" /></td>
                 </tr>
               ))
            ) : resources?.length === 0 ? (
               <tr>
                 <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                   No resources found. Try adjusting your search or filters.
                 </td>
               </tr>
            ) : (
              resources?.map((resource) => (
                <tr key={resource.id} className="group hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-foreground text-base">{resource.name}</span>
                      <span className="text-muted-foreground line-clamp-2">{resource.services || "No services listed"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                      {resource.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col gap-1 text-muted-foreground">
                      {resource.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> {resource.phone}
                        </div>
                      )}
                      {resource.address && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" /> <span className="truncate max-w-[150px]">{resource.address}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <StatusBadge status={resource.status} />
                  </td>
                  <td className="px-6 py-4 align-top text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-8 w-8 text-muted-foreground hover:text-amber-400"
                         onClick={() => toggleFavorite(resource)}
                       >
                         <Star className={`w-4 h-4 ${resource.isFavorite ? "fill-current text-amber-400" : ""}`} />
                       </Button>
                       
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingResource(resource)}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          {/* Add delete implementation if needed, though schema has it */}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingResource} onOpenChange={(open) => !open && setEditingResource(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
          </DialogHeader>
          {editingResource && (
            <ResourceForm 
              initialData={editingResource}
              onSubmit={handleUpdate}
              isSubmitting={updateMutation.isPending}
              onCancel={() => setEditingResource(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
