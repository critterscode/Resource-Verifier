import { useState } from "react";
import { useResources, useResourceCount, useCreateResource, useUpdateResource, useCategories, useTags, useBulkUpdateResources } from "@/hooks/use-resources";
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
  MapPin,
  ExternalLink,
  Tag,
  CheckSquare,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import type { Resource } from "@shared/schema";
import { api } from "@shared/routes";

function makeWebsiteUrl(website: string): string {
  if (!website) return '';
  if (website.startsWith('http://') || website.startsWith('https://')) return website;
  return `https://${website}`;
}

export default function Resources() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const filterParams = {
    search: search || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    status: statusFilter !== "all" ? statusFilter as any : undefined,
  };

  const { data: resources, isLoading } = useResources({
    ...filterParams,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const { data: totalCount } = useResourceCount(filterParams);
  const totalPages = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 0;

  const { data: categories } = useCategories();
  const { data: existingTags } = useTags();
  const createMutation = useCreateResource();
  const updateMutation = useUpdateResource();
  const bulkUpdateMutation = useBulkUpdateResources();

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

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!resources) return;
    if (selectedIds.size === resources.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(resources.map(r => r.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setShowBulkPanel(false);
  };

  const bulkApplyStatus = (status: string) => {
    if (selectedIds.size === 0) return;
    bulkUpdateMutation.mutate(
      { ids: Array.from(selectedIds), updates: { status: status as any } },
      { onSuccess: () => clearSelection() }
    );
  };

  const bulkAddTag = (tag: string) => {
    if (selectedIds.size === 0 || !resources) return;
    const ids = Array.from(selectedIds);
    const selectedResources = resources.filter(r => ids.includes(r.id));
    const needsUpdate = selectedResources.filter(r => !(r.tags || []).includes(tag));
    if (needsUpdate.length === 0) return;
    for (const r of needsUpdate) {
      updateMutation.mutate({ id: r.id, updates: { tags: [...(r.tags || []), tag] } });
    }
  };

  const bulkAddCustomTag = () => {
    const trimmed = bulkTagInput.trim();
    if (!trimmed) return;
    bulkAddTag(trimmed);
    setBulkTagInput("");
  };

  const isAllSelected = resources && resources.length > 0 && selectedIds.size === resources.length;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Resources</h1>
          <p className="text-muted-foreground">Manage and verify community resources.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-resource">
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Resource</DialogTitle>
                <DialogDescription>Fill in the details for the new resource.</DialogDescription>
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
            data-testid="input-search"
            placeholder="Search by name, services, phone..." 
            className="pl-9" 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
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

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="needs_info">Needs Info</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="limited">Limited</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-4 flex-wrap" data-testid="panel-bulk-actions">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium" data-testid="text-selected-count">{selectedIds.size} selected</span>
            <Button variant="ghost" size="icon" onClick={clearSelection} data-testid="button-clear-selection">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select onValueChange={(val) => bulkApplyStatus(val)}>
              <SelectTrigger className="w-[150px] h-8 text-xs" data-testid="select-bulk-status">
                <SelectValue placeholder="Set status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="needs_info">Needs Info</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="limited">Limited</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkPanel(!showBulkPanel)}
              data-testid="button-bulk-tags"
            >
              <Tag className="w-3 h-3 mr-1" /> Add Tags
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Tag Panel */}
      {showBulkPanel && selectedIds.size > 0 && (
        <div className="bg-card border border-border rounded-lg p-3" data-testid="panel-bulk-tags">
          <span className="text-xs text-muted-foreground font-semibold uppercase block mb-2">Add tag to {selectedIds.size} resources</span>
          <div className="flex flex-wrap gap-1 mb-2">
            {existingTags?.slice(0, 20).map(tag => (
              <button
                key={tag}
                onClick={() => bulkAddTag(tag)}
                data-testid={`button-bulk-tag-${tag.replace(/\s+/g, '-').toLowerCase()}`}
                className="text-xs px-2 py-0.5 rounded border bg-muted/40 text-muted-foreground border-border hover:bg-muted transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={bulkTagInput}
              onChange={(e) => setBulkTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); bulkAddCustomTag(); }}}
              placeholder="Custom tag..."
              data-testid="input-bulk-tag"
              className="flex-1 h-8 text-xs"
            />
            <Button variant="outline" size="sm" onClick={bulkAddCustomTag} data-testid="button-bulk-add-tag">
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>
        </div>
      )}

      {/* Resource Grid */}
      <div className="flex-1 overflow-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border sticky top-0 backdrop-blur-sm z-10">
            <tr>
              <th className="px-3 py-4 w-10">
                <Checkbox
                  checked={isAllSelected || false}
                  onCheckedChange={selectAll}
                  data-testid="checkbox-select-all"
                />
              </th>
              <th className="px-4 py-4 w-[35%]">Name & Description</th>
              <th className="px-4 py-4">Category</th>
              <th className="px-4 py-4">Contact</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
               Array.from({ length: 5 }).map((_, i) => (
                 <tr key={i}>
                   <td className="px-3 py-4"><Skeleton className="h-4 w-4" /></td>
                   <td className="px-4 py-4"><Skeleton className="h-10 w-48" /></td>
                   <td className="px-4 py-4"><Skeleton className="h-6 w-24" /></td>
                   <td className="px-4 py-4"><Skeleton className="h-6 w-32" /></td>
                   <td className="px-4 py-4"><Skeleton className="h-6 w-20" /></td>
                   <td className="px-4 py-4"><Skeleton className="h-8 w-8 ml-auto" /></td>
                 </tr>
               ))
            ) : resources?.length === 0 ? (
               <tr>
                 <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                   No resources found. Try adjusting your search or filters.
                 </td>
               </tr>
            ) : (
              resources?.map((resource: Resource) => (
                <tr 
                  key={resource.id} 
                  className={`group hover:bg-muted/30 transition-colors ${selectedIds.has(resource.id) ? 'bg-primary/5' : ''}`}
                  data-testid={`row-resource-${resource.id}`}
                >
                  <td className="px-3 py-4 align-top">
                    <Checkbox
                      checked={selectedIds.has(resource.id)}
                      onCheckedChange={() => toggleSelect(resource.id)}
                      data-testid={`checkbox-resource-${resource.id}`}
                    />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-col gap-1">
                      <a 
                        href={`https://www.google.com/search?q=${encodeURIComponent(resource.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-foreground text-base hover:text-primary hover:underline inline-flex items-center gap-1"
                        data-testid={`link-name-${resource.id}`}
                      >
                        {resource.name}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                      </a>
                      <span className="text-muted-foreground line-clamp-2 text-xs">{resource.services || "No services listed"}</span>
                      {resource.tags && resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {resource.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              <Tag className="w-2.5 h-2.5" />{tag}
                            </span>
                          ))}
                          {resource.tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{resource.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                      {resource.category}
                    </span>
                    {resource.categories && resource.categories.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {resource.categories.map(c => (
                          <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{c}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-col gap-1 text-muted-foreground text-xs">
                      {resource.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> {resource.phone}
                        </div>
                      )}
                      {resource.website && (
                        <a 
                          href={makeWebsiteUrl(resource.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-primary hover:underline truncate max-w-[180px]"
                          data-testid={`link-website-${resource.id}`}
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" /> 
                          {resource.website.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                      {resource.address && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate max-w-[150px]">{resource.address}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <StatusBadge status={resource.status} />
                  </td>
                  <td className="px-4 py-4 align-top text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         onClick={() => toggleFavorite(resource)}
                         data-testid={`button-favorite-${resource.id}`}
                       >
                         <Star className={`w-4 h-4 ${resource.isFavorite ? "fill-current text-amber-400" : "text-muted-foreground"}`} />
                       </Button>
                       
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-actions-${resource.id}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingResource(resource)} data-testid={`button-edit-${resource.id}`}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 py-2">
          <span className="text-sm text-muted-foreground" data-testid="text-pagination-info">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount || 0)} of {totalCount} resources
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setPage(p => p - 1); setSelectedIds(new Set()); }}
              disabled={page === 0}
              data-testid="button-page-prev"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <span className="text-sm font-medium" data-testid="text-page-number">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setPage(p => p + 1); setSelectedIds(new Set()); }}
              disabled={page >= totalPages - 1}
              data-testid="button-page-next"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingResource} onOpenChange={(open) => !open && setEditingResource(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>Update the resource details below.</DialogDescription>
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
