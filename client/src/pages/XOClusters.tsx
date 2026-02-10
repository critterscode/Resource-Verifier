import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useResources, useCategories, useTags, useUpdateResource, useBulkUpdateResources } from "@/hooks/use-resources";
import type { Resource } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Filter,
  X,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Phone,
  Mail,
  Globe,
  MapPin,
  Tag,
  ArrowRight,
  Layers,
  Eye,
} from "lucide-react";

type StatusType = "unverified" | "verified" | "needs_info" | "closed" | "limited";

const STATUS_CONFIG: Record<StatusType, { label: string; icon: typeof CheckCircle2; color: string; bgClass: string; borderClass: string }> = {
  unverified: { label: "Unverified", icon: HelpCircle, color: "text-muted-foreground", bgClass: "bg-muted/30", borderClass: "border-muted-foreground/20" },
  needs_info: { label: "Needs Info", icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bgClass: "bg-amber-500/5", borderClass: "border-amber-500/20" },
  verified: { label: "Verified", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bgClass: "bg-emerald-500/5", borderClass: "border-emerald-500/20" },
  limited: { label: "Limited", icon: Clock, color: "text-blue-600 dark:text-blue-400", bgClass: "bg-blue-500/5", borderClass: "border-blue-500/20" },
  closed: { label: "Closed", icon: XCircle, color: "text-red-600 dark:text-red-400", bgClass: "bg-red-500/5", borderClass: "border-red-500/20" },
};

const LANE_ORDER: StatusType[] = ["unverified", "needs_info", "verified", "limited", "closed"];

const LANE_LIMIT = 20;

function ResourceCard({
  resource,
  isSelected,
  onSelect,
  onViewDetail,
}: {
  resource: Resource;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onViewDetail: (r: Resource) => void;
}) {
  const statusCfg = STATUS_CONFIG[resource.status as StatusType];
  const missingFields: string[] = [];
  if (!resource.phone) missingFields.push("Phone");
  if (!resource.email) missingFields.push("Email");
  if (!resource.website) missingFields.push("Website");
  if (!resource.hours) missingFields.push("Hours");
  if (!resource.address) missingFields.push("Address");

  return (
    <div
      className={`group relative border rounded-md p-3 transition-all cursor-pointer ${
        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover-elevate"
      }`}
      data-testid={`cluster-card-${resource.id}`}
    >
      <div className="flex items-start gap-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(resource.id)}
          className="mt-0.5"
          data-testid={`cluster-checkbox-${resource.id}`}
        />
        <div className="flex-1 min-w-0" onClick={() => onViewDetail(resource)}>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate" data-testid={`cluster-name-${resource.id}`}>
              {resource.name}
            </span>
          </div>
          <div className="flex items-center gap-1 mb-1.5">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {resource.category}
            </Badge>
            {resource.confidenceScore !== null && resource.confidenceScore !== undefined && (
              <span className={`text-[10px] font-mono ${
                resource.confidenceScore >= 70 ? "text-emerald-600 dark:text-emerald-400" :
                resource.confidenceScore >= 40 ? "text-amber-600 dark:text-amber-400" :
                "text-red-600 dark:text-red-400"
              }`} data-testid={`cluster-confidence-${resource.id}`}>
                {resource.confidenceScore}%
              </span>
            )}
          </div>
          {missingFields.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span className="truncate">Missing: {missingFields.join(", ")}</span>
            </div>
          )}
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {resource.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-[9px] px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {resource.tags.length > 3 && (
                <span className="text-[9px] text-muted-foreground">+{resource.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="invisible group-hover:visible"
          onClick={(e) => { e.stopPropagation(); onViewDetail(resource); }}
          data-testid={`cluster-view-${resource.id}`}
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function StatusLane({
  status,
  resources,
  count,
  isExpanded,
  onToggleExpand,
  selectedIds,
  onSelect,
  onViewDetail,
  isLoading,
}: {
  status: StatusType;
  resources: Resource[];
  count: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectedIds: Set<number>;
  onSelect: (id: number) => void;
  onViewDetail: (r: Resource) => void;
  isLoading: boolean;
}) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  const laneSelected = resources.filter(r => selectedIds.has(r.id)).length;

  return (
    <div className={`flex flex-col border rounded-md ${cfg.borderClass} ${cfg.bgClass} min-w-[280px] max-w-[340px] flex-1`} data-testid={`cluster-lane-${status}`}>
      <button
        className="flex items-center justify-between gap-2 px-3 py-2.5 w-full text-left"
        onClick={onToggleExpand}
        data-testid={`cluster-lane-header-${status}`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${cfg.color}`} />
          <span className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
            {count}
          </Badge>
          {laneSelected > 0 && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0">
              {laneSelected} sel
            </Badge>
          )}
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {isExpanded && (
        <ScrollArea className="flex-1 max-h-[calc(100vh-320px)]">
          <div className="px-2 pb-2 space-y-1.5">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : resources.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No resources in this lane
              </div>
            ) : (
              <>
                {resources.map(r => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    isSelected={selectedIds.has(r.id)}
                    onSelect={onSelect}
                    onViewDetail={onViewDetail}
                  />
                ))}
                {count > resources.length && (
                  <div className="text-center py-2 text-muted-foreground text-xs">
                    Showing {resources.length} of {count}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function ResourceDetailPanel({ resource, onClose, onStatusChange }: {
  resource: Resource;
  onClose: () => void;
  onStatusChange: (id: number, status: StatusType) => void;
}) {
  const statusCfg = STATUS_CONFIG[resource.status as StatusType];
  const StatusIcon = statusCfg.icon;

  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className="truncate">{resource.name}</span>
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(resource.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-detail-google-search"
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={statusCfg.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusCfg.label}
          </Badge>
          <Badge variant="outline">{resource.category}</Badge>
          {resource.confidenceScore !== null && resource.confidenceScore !== undefined && (
            <Badge variant="secondary" className="font-mono text-xs">
              Confidence: {resource.confidenceScore}%
            </Badge>
          )}
        </div>

        <div className="text-sm font-medium text-muted-foreground">Quick Triage</div>
        <div className="flex flex-wrap gap-1.5">
          {LANE_ORDER.filter(s => s !== resource.status).map(s => {
            const c = STATUS_CONFIG[s];
            const I = c.icon;
            return (
              <Button
                key={s}
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(resource.id, s)}
                data-testid={`detail-set-status-${s}`}
              >
                <I className={`w-3 h-3 mr-1 ${c.color}`} />
                {c.label}
              </Button>
            );
          })}
        </div>

        {resource.services && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Services</div>
            <p className="text-sm">{resource.services}</p>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Contact</div>
          {resource.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{resource.phone}</span>
            </div>
          )}
          {resource.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <a href={`mailto:${resource.email}`} className="text-primary hover:underline">{resource.email}</a>
            </div>
          )}
          {resource.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <a
                href={resource.website.startsWith("http") ? resource.website : `https://${resource.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
              >
                {resource.website}
              </a>
            </div>
          )}
          {resource.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{resource.address}</span>
            </div>
          )}
        </div>

        {resource.hours && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Hours</div>
            <p className="text-sm">{resource.hours}</p>
          </div>
        )}

        {resource.eligibility && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Eligibility</div>
            <p className="text-sm">{resource.eligibility}</p>
          </div>
        )}

        {resource.tags && resource.tags.length > 0 && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Tags</div>
            <div className="flex flex-wrap gap-1">
              {resource.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        {resource.internalNotes && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Internal Notes</div>
            <p className="text-sm bg-muted/50 rounded-md p-2">{resource.internalNotes}</p>
          </div>
        )}
      </div>
    </DialogContent>
  );
}

export default function XOClusters() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [expandedLanes, setExpandedLanes] = useState<Set<StatusType>>(() => new Set<StatusType>(["unverified", "needs_info", "verified"]));
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [detailResource, setDetailResource] = useState<Resource | null>(null);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<StatusType>("verified");

  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const updateMutation = useUpdateResource();
  const bulkUpdateMutation = useBulkUpdateResources();

  const filters: Record<string, any> = {};
  if (search) filters.search = search;
  if (categoryFilter !== "all") filters.category = categoryFilter;
  if (tagFilter !== "all") filters.tag = tagFilter;

  const countParams = new URLSearchParams();
  if (search) countParams.set("search", search);
  if (categoryFilter !== "all") countParams.set("category", categoryFilter);
  if (tagFilter !== "all") countParams.set("tag", tagFilter);

  const { data: statusCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/resources/status-counts", search, categoryFilter, tagFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (tagFilter !== "all") params.set("tag", tagFilter);
      const res = await fetch(`/api/resources/status-counts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch status counts");
      return res.json();
    },
  });

  const laneQueries = LANE_ORDER.map(status => {
    const queryFilters = { ...filters, status, limit: LANE_LIMIT };
    return useResources(queryFilters);
  });

  const toggleExpand = useCallback((status: StatusType) => {
    setExpandedLanes(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleStatusChange = useCallback((id: number, status: StatusType) => {
    updateMutation.mutate({ id, updates: { status } });
    setDetailResource(null);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [updateMutation]);

  const handleBulkStatusChange = useCallback(() => {
    if (selectedIds.size === 0) return;
    bulkUpdateMutation.mutate({
      ids: Array.from(selectedIds),
      updates: { status: bulkTargetStatus },
    });
    setSelectedIds(new Set());
  }, [selectedIds, bulkTargetStatus, bulkUpdateMutation]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const hasFilters = search || categoryFilter !== "all" || tagFilter !== "all";
  const totalResources = Object.values(statusCounts).reduce((sum: number, c: number) => sum + c, 0);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold font-display" data-testid="text-xo-clusters-title">XO Clusters</h1>
          <Badge variant="secondary" className="font-mono text-xs" data-testid="text-total-count">
            {totalResources} total
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-cluster-search"
          />
        </div>
        <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v)}>
          <SelectTrigger className="w-[180px]" data-testid="select-cluster-category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tagFilter} onValueChange={v => setTagFilter(v)}>
          <SelectTrigger className="w-[160px]" data-testid="select-cluster-tag">
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              <SelectValue placeholder="All Tags" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {tags.slice(0, 50).map(tag => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setSearch(""); setCategoryFilter("all"); setTagFilter("all"); }}
            data-testid="button-clear-cluster-filters"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {selectedIds.size > 0 && (
        <Card className="border-primary/30">
          <CardContent className="flex items-center gap-3 py-2 px-4">
            <span className="text-sm font-medium" data-testid="text-selected-count">
              {selectedIds.size} selected
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <Select value={bulkTargetStatus} onValueChange={v => setBulkTargetStatus(v as StatusType)}>
              <SelectTrigger className="w-[160px]" data-testid="select-bulk-target-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANE_ORDER.map(s => {
                  const c = STATUS_CONFIG[s];
                  return <SelectItem key={s} value={s}>{c.label}</SelectItem>;
                })}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleBulkStatusChange}
              disabled={bulkUpdateMutation.isPending}
              data-testid="button-bulk-move"
            >
              {bulkUpdateMutation.isPending ? "Moving..." : "Move"}
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection} data-testid="button-clear-selection">
              Clear
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 overflow-x-auto flex-1 pb-2">
        {LANE_ORDER.map((status, idx) => {
          const laneData = laneQueries[idx].data as Resource[] | undefined;
          const laneResources = laneData ?? [];
          const count = statusCounts[status] ?? 0;

          return (
            <StatusLane
              key={status}
              status={status}
              resources={laneResources}
              count={count}
              isExpanded={expandedLanes.has(status)}
              onToggleExpand={() => toggleExpand(status)}
              selectedIds={selectedIds}
              onSelect={toggleSelect}
              onViewDetail={setDetailResource}
              isLoading={laneQueries[idx].isLoading}
            />
          );
        })}
      </div>

      <Dialog open={!!detailResource} onOpenChange={(open) => { if (!open) setDetailResource(null); }}>
        {detailResource && (
          <ResourceDetailPanel
            resource={detailResource}
            onClose={() => setDetailResource(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </Dialog>
    </div>
  );
}
