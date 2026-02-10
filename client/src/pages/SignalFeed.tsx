import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import type { SignalItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Radio,
  AlertTriangle,
  XCircle,
  Users,
  FileText,
  Calendar,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Edit,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

const SIGNAL_TYPES = [
  { value: "closure", label: "Closure", icon: XCircle, color: "text-red-500" },
  { value: "capacity", label: "Capacity", icon: Users, color: "text-orange-500" },
  { value: "policy", label: "Policy", icon: FileText, color: "text-blue-500" },
  { value: "event", label: "Event", icon: Calendar, color: "text-green-500" },
  { value: "alert", label: "Alert", icon: AlertTriangle, color: "text-yellow-500" },
  { value: "rumor", label: "Rumor", icon: HelpCircle, color: "text-muted-foreground" },
] as const;

const LANES = [
  { value: "action", label: "Action Required" },
  { value: "noise", label: "Noise / Low Priority" },
] as const;

function getTypeConfig(type: string | null) {
  return SIGNAL_TYPES.find(t => t.value === type) || SIGNAL_TYPES[5];
}

function SignalCard({
  signal,
  onMoveToLane,
  onEdit,
  onDelete,
  onView,
}: {
  signal: SignalItem;
  onMoveToLane: (id: number, lane: "action" | "noise") => void;
  onEdit: (signal: SignalItem) => void;
  onDelete: (id: number) => void;
  onView: (signal: SignalItem) => void;
}) {
  const typeConfig = getTypeConfig(signal.type);
  const TypeIcon = typeConfig.icon;
  const targetLane = signal.lane === "action" ? "noise" : "action";

  return (
    <Card
      className="p-4 group cursor-pointer hover-elevate"
      onClick={() => onView(signal)}
      data-testid={`signal-card-${signal.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${typeConfig.color}`}>
          <TypeIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm leading-tight line-clamp-2" data-testid={`signal-title-${signal.id}`}>
              {signal.title}
            </h3>
            <div className="flex items-center gap-1 invisible group-hover:visible shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); onMoveToLane(signal.id, targetLane); }}
                data-testid={`signal-move-${signal.id}`}
                title={`Move to ${targetLane}`}
              >
                {signal.lane === "action" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); onEdit(signal); }}
                data-testid={`signal-edit-${signal.id}`}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); onDelete(signal.id); }}
                data-testid={`signal-delete-${signal.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {signal.summary && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{signal.summary}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              <TypeIcon className="w-3 h-3 mr-1" />
              {typeConfig.label}
            </Badge>

            {signal.impactScore != null && signal.impactScore > 0 && (
              <Badge variant="outline" className="text-xs" data-testid={`signal-impact-${signal.id}`}>
                Impact: {signal.impactScore}
              </Badge>
            )}

            {signal.bsScore != null && signal.bsScore > 0 && (
              <Badge variant="outline" className="text-xs text-orange-600" data-testid={`signal-bs-${signal.id}`}>
                BS: {signal.bsScore}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {signal.createdAt && (
              <span>{format(new Date(signal.createdAt), "MMM d, yyyy h:mm a")}</span>
            )}
            {signal.relatedResourceIds && signal.relatedResourceIds.length > 0 && (
              <span className="text-muted-foreground">
                {signal.relatedResourceIds.length} linked resource{signal.relatedResourceIds.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function CreateEditDialog({
  open,
  onOpenChange,
  signal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signal?: SignalItem | null;
}) {
  const { toast } = useToast();
  const isEditing = !!signal;

  const [title, setTitle] = useState(signal?.title || "");
  const [summary, setSummary] = useState(signal?.summary || "");
  const [type, setType] = useState<string>(signal?.type || "alert");
  const [lane, setLane] = useState<string>(signal?.lane || "noise");
  const [impactScore, setImpactScore] = useState(signal?.impactScore?.toString() || "0");
  const [bsScore, setBsScore] = useState(signal?.bsScore?.toString() || "0");
  const [relatedIds, setRelatedIds] = useState(signal?.relatedResourceIds?.join(", ") || "");

  const invalidateSignals = () => {
    queryClient.invalidateQueries({
      predicate: (query) =>
        typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("/api/signals"),
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", api.signals.create.path, data);
    },
    onSuccess: () => {
      invalidateSignals();
      toast({ title: "Signal created" });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/signals/${signal!.id}`, data);
    },
    onSuccess: () => {
      invalidateSignals();
      toast({ title: "Signal updated" });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    const parsedIds = relatedIds
      .split(",")
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));

    const data = {
      title,
      summary: summary || null,
      type,
      lane,
      impactScore: parseInt(impactScore) || 0,
      bsScore: parseInt(bsScore) || 0,
      relatedResourceIds: parsedIds.length > 0 ? parsedIds : null,
    };

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="signal-form-dialog">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Signal" : "New Signal"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What's happening?"
              data-testid="input-signal-title"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Summary</label>
            <Textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="More details about this signal..."
              className="resize-none"
              data-testid="input-signal-summary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-signal-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIGNAL_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Lane</label>
              <Select value={lane} onValueChange={setLane}>
                <SelectTrigger data-testid="select-signal-lane">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANES.map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Impact Score (0-100)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={impactScore}
                onChange={e => setImpactScore(e.target.value)}
                data-testid="input-signal-impact"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">BS Score (0-100)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={bsScore}
                onChange={e => setBsScore(e.target.value)}
                data-testid="input-signal-bs"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Related Resource IDs (comma-separated)</label>
            <Input
              value={relatedIds}
              onChange={e => setRelatedIds(e.target.value)}
              placeholder="e.g. 42, 99, 123"
              data-testid="input-signal-related-ids"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-signal-cancel">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isPending} data-testid="button-signal-submit">
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailDialog({
  signal,
  open,
  onOpenChange,
  onEdit,
  onMoveToLane,
}: {
  signal: SignalItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (signal: SignalItem) => void;
  onMoveToLane: (id: number, lane: "action" | "noise") => void;
}) {
  if (!signal) return null;

  const typeConfig = getTypeConfig(signal.type);
  const TypeIcon = typeConfig.icon;
  const targetLane = signal.lane === "action" ? "noise" : "action";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="signal-detail-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
            {signal.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {signal.summary && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Summary</h4>
              <p className="text-sm">{signal.summary}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Type</h4>
              <Badge variant="secondary">
                <TypeIcon className="w-3 h-3 mr-1" />
                {typeConfig.label}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Lane</h4>
              <Badge variant={signal.lane === "action" ? "default" : "outline"}>
                {signal.lane === "action" ? "Action Required" : "Noise"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Impact Score</h4>
              <span className="text-sm font-mono">{signal.impactScore ?? 0}/100</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">BS Score</h4>
              <span className="text-sm font-mono">{signal.bsScore ?? 0}/100</span>
            </div>
          </div>

          {signal.relatedResourceIds && signal.relatedResourceIds.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Linked Resources</h4>
              <div className="flex flex-wrap gap-1">
                {signal.relatedResourceIds.map(id => (
                  <Badge key={id} variant="outline" className="text-xs">#{id}</Badge>
                ))}
              </div>
            </div>
          )}

          {signal.sourceReceipts && signal.sourceReceipts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Source Receipts</h4>
              <div className="flex flex-wrap gap-1">
                {signal.sourceReceipts.map((r, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{r}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Created: {signal.createdAt ? format(new Date(signal.createdAt), "MMM d, yyyy h:mm a") : "Unknown"}
            {signal.lastVerifiedAt && (
              <> | Last verified: {format(new Date(signal.lastVerifiedAt), "MMM d, yyyy")}</>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onMoveToLane(signal.id, targetLane)}
            data-testid="detail-move-lane"
          >
            {signal.lane === "action" ? (
              <><ArrowRight className="w-4 h-4 mr-2" />Move to Noise</>
            ) : (
              <><ArrowLeft className="w-4 h-4 mr-2" />Move to Action</>
            )}
          </Button>
          <Button
            onClick={() => { onOpenChange(false); onEdit(signal); }}
            data-testid="detail-edit"
          >
            <Edit className="w-4 h-4 mr-2" />Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SignalFeed() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editSignal, setEditSignal] = useState<SignalItem | null>(null);
  const [viewSignal, setViewSignal] = useState<SignalItem | null>(null);

  const buildUrl = (basePath: string, extraParams: Record<string, string> = {}) => {
    const params: Record<string, string> = { ...extraParams };
    if (search) params.search = search;
    if (typeFilter && typeFilter !== "all") params.type = typeFilter;
    const qs = new URLSearchParams(params).toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  const actionUrl = buildUrl(api.signals.list.path, { lane: "action", limit: "50" });
  const noiseUrl = buildUrl(api.signals.list.path, { lane: "noise", limit: "50" });
  const countUrl = buildUrl(api.signals.count.path);

  const actionQuery = useQuery<SignalItem[]>({
    queryKey: [actionUrl],
  });

  const noiseQuery = useQuery<SignalItem[]>({
    queryKey: [noiseUrl],
  });

  const totalCountQuery = useQuery<{ count: number }>({
    queryKey: [countUrl],
  });

  const invalidateSignals = () => {
    queryClient.invalidateQueries({
      predicate: (query) =>
        typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("/api/signals"),
    });
  };

  const moveMutation = useMutation({
    mutationFn: async ({ id, lane }: { id: number; lane: string }) => {
      return apiRequest("PUT", `/api/signals/${id}`, { lane });
    },
    onSuccess: () => {
      invalidateSignals();
      toast({ title: "Signal moved" });
      setViewSignal(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/signals/${id}`);
    },
    onSuccess: () => {
      invalidateSignals();
      toast({ title: "Signal deleted" });
    },
  });

  const actionItems = actionQuery.data || [];
  const noiseItems = noiseQuery.data || [];
  const totalCount = totalCountQuery.data?.count ?? 0;
  const isLoading = actionQuery.isLoading || noiseQuery.isLoading;

  const handleEdit = (signal: SignalItem) => {
    setEditSignal(signal);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleMoveToLane = (id: number, lane: "action" | "noise") => {
    moveMutation.mutate({ id, lane });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Radio className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-display" data-testid="text-signal-feed-title">
              Signal Feed
            </h1>
            <p className="text-sm text-muted-foreground">
              Track closures, changes, and community intel
            </p>
          </div>
          <Badge variant="secondary" data-testid="text-signal-total-count">
            {totalCount}
          </Badge>
        </div>

        <Button onClick={() => setCreateOpen(true)} data-testid="button-create-signal">
          <Plus className="w-4 h-4 mr-2" />
          New Signal
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search signals..."
            className="pl-9"
            data-testid="input-signal-search"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-signal-type-filter">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {SIGNAL_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div data-testid="signal-lane-action">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <h2 className="font-semibold text-lg">Action Required</h2>
              <Badge variant="secondary" className="ml-1" data-testid="text-action-count">
                {actionItems.length}
              </Badge>
            </div>

            {actionItems.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground text-sm">No action items right now</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {actionItems.map(signal => (
                  <SignalCard
                    key={signal.id}
                    signal={signal}
                    onMoveToLane={handleMoveToLane}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={setViewSignal}
                  />
                ))}
              </div>
            )}
          </div>

          <div data-testid="signal-lane-noise">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-muted-foreground" />
              <h2 className="font-semibold text-lg">Noise / Low Priority</h2>
              <Badge variant="secondary" className="ml-1" data-testid="text-noise-count">
                {noiseItems.length}
              </Badge>
            </div>

            {noiseItems.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground text-sm">No signals in this lane</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {noiseItems.map(signal => (
                  <SignalCard
                    key={signal.id}
                    signal={signal}
                    onMoveToLane={handleMoveToLane}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={setViewSignal}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {createOpen && (
        <CreateEditDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}

      {editSignal && (
        <CreateEditDialog
          open={!!editSignal}
          onOpenChange={(open) => { if (!open) setEditSignal(null); }}
          signal={editSignal}
        />
      )}

      <DetailDialog
        signal={viewSignal}
        open={!!viewSignal}
        onOpenChange={(open) => { if (!open) setViewSignal(null); }}
        onEdit={handleEdit}
        onMoveToLane={handleMoveToLane}
      />
    </div>
  );
}
