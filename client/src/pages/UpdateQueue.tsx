import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { UpdateRequest, Resource } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Inbox,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Loader2,
  ArrowRight,
  Link as LinkIcon,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

type UpdateRequestWithResource = UpdateRequest & { resourceName?: string };

const STATUS_TABS = [
  { value: "new", label: "New", icon: Inbox },
  { value: "in_review", label: "In Review", icon: Clock },
  { value: "accepted", label: "Accepted", icon: CheckCircle },
  { value: "rejected", label: "Rejected", icon: XCircle },
] as const;

function StatusBadge({ status }: { status: string | null }) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    new: { label: "New", variant: "secondary" },
    in_review: { label: "In Review", variant: "outline" },
    accepted: { label: "Accepted", variant: "default" },
    rejected: { label: "Rejected", variant: "destructive" },
  };
  const c = config[status || "new"] || config.new;
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

function ReviewDialog({
  request,
  open,
  onOpenChange,
}: {
  request: UpdateRequestWithResource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();

  const resourceUrl = request.resourceId ? `/api/resources/${request.resourceId}` : null;
  const resourceQuery = useQuery<Resource>({
    queryKey: [resourceUrl!],
    enabled: !!resourceUrl,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({
      predicate: (q) => typeof q.queryKey[0] === "string" && q.queryKey[0].startsWith("/api/update-requests"),
    });
    queryClient.invalidateQueries({
      predicate: (q) => typeof q.queryKey[0] === "string" && q.queryKey[0].startsWith("/api/resources"),
    });
  };

  const acceptMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/update-requests/${request.id}/accept`);
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Update accepted", description: "Changes have been applied to the resource." });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/update-requests/${request.id}/reject`);
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Update rejected" });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const currentResource = resourceQuery.data;
  const proposedChanges = (request.proposedChanges || {}) as Record<string, any>;
  const changedFields = Object.keys(proposedChanges);
  const canAct = request.status === "new" || request.status === "in_review";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="review-dialog">
        <DialogHeader>
          <DialogTitle>Review Update Request</DialogTitle>
          <DialogDescription>
            {request.resourceName || `Resource #${request.resourceId}`} — submitted by {request.submittedBy}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={request.status} />
            <span className="text-xs text-muted-foreground">
              Submitted {request.createdAt ? format(new Date(request.createdAt), "MMM d, yyyy h:mm a") : ""}
            </span>
          </div>

          {request.notes && (
            <div className="bg-muted/50 rounded-md p-3">
              <div className="text-xs font-medium text-muted-foreground mb-1">Provider Notes</div>
              <p className="text-sm">{request.notes}</p>
            </div>
          )}

          {request.evidenceLink && (
            <a
              href={request.evidenceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary flex items-center gap-1"
              data-testid="link-evidence"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              View Evidence
            </a>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              Proposed Changes
              <Badge variant="secondary">{changedFields.length} field{changedFields.length !== 1 ? "s" : ""}</Badge>
            </h3>

            {resourceQuery.isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {changedFields.map((field) => {
                  const currentVal = currentResource ? (currentResource as any)[field] || "" : "";
                  const proposedVal = proposedChanges[field] || "";
                  const isChanged = currentVal !== proposedVal;

                  return (
                    <div key={field} className="border border-border rounded-md overflow-hidden" data-testid={`diff-field-${field}`}>
                      <div className="bg-muted/30 px-3 py-1.5 border-b border-border">
                        <span className="text-xs font-medium">{field}</span>
                      </div>
                      <div className="grid grid-cols-2 divide-x divide-border">
                        <div className="p-3">
                          <div className="text-xs text-muted-foreground mb-1">Current</div>
                          <div className="text-sm whitespace-pre-wrap break-words">
                            {currentVal || <span className="text-muted-foreground italic">(empty)</span>}
                          </div>
                        </div>
                        <div className={`p-3 ${isChanged ? "bg-green-500/5" : ""}`}>
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            Proposed
                            {isChanged && <ArrowRight className="w-3 h-3" />}
                          </div>
                          <div className="text-sm whitespace-pre-wrap break-words">
                            {proposedVal || <span className="text-muted-foreground italic">(empty)</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {canAct && (
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending || acceptMutation.isPending}
              data-testid="button-reject-request"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-1" />
              )}
              Reject
            </Button>
            <Button
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending || rejectMutation.isPending}
              data-testid="button-accept-request"
            >
              {acceptMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-1" />
              )}
              Accept Changes
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function UpdateQueue() {
  const [statusFilter, setStatusFilter] = useState("new");
  const [selectedRequest, setSelectedRequest] = useState<UpdateRequestWithResource | null>(null);

  const listUrl = `/api/update-requests?status=${statusFilter}&limit=50`;
  const countUrl = `/api/update-requests/count?status=${statusFilter}`;
  const newCountUrl = `/api/update-requests/count?status=new`;

  const requestsQuery = useQuery<UpdateRequestWithResource[]>({
    queryKey: [listUrl],
  });

  const countQuery = useQuery<{ count: number }>({
    queryKey: [countUrl],
  });

  const newCountQuery = useQuery<{ count: number }>({
    queryKey: [newCountUrl],
  });

  const requests = requestsQuery.data || [];
  const totalCount = countQuery.data?.count ?? 0;
  const newCount = newCountQuery.data?.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold font-display" data-testid="text-update-queue-title">Update Queue</h1>
          {newCount > 0 && (
            <Badge variant="destructive" data-testid="badge-new-count">{newCount} new</Badge>
          )}
        </div>
        <Badge variant="secondary" data-testid="text-queue-total">{totalCount} total</Badge>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_TABS.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={statusFilter === value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(value)}
            className="toggle-elevate"
            data-testid={`button-filter-${value}`}
          >
            <Icon className="w-4 h-4 mr-1" />
            {label}
          </Button>
        ))}
      </div>

      {requestsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="p-12 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground" data-testid="text-empty-queue">
            No {statusFilter === "new" ? "pending" : statusFilter.replace("_", " ")} update requests.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {requests.map((req) => {
            const proposedChanges = (req.proposedChanges || {}) as Record<string, any>;
            const changedFields = Object.keys(proposedChanges);

            return (
              <Card
                key={req.id}
                className="p-4 hover-elevate cursor-pointer"
                onClick={() => setSelectedRequest(req)}
                data-testid={`update-request-card-${req.id}`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm" data-testid={`text-request-name-${req.id}`}>
                        {req.resourceName || `Resource #${req.resourceId}`}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span>by {req.submittedBy || "Unknown"}</span>
                      <span>{req.createdAt ? format(new Date(req.createdAt), "MMM d, yyyy") : ""}</span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {changedFields.map((f) => (
                        <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                      ))}
                    </div>
                    {req.notes && (
                      <p className="text-xs text-muted-foreground truncate">{req.notes}</p>
                    )}
                    {req.evidenceLink && (
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <LinkIcon className="w-3 h-3" />
                        <span>Has evidence</span>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" data-testid={`button-review-${req.id}`}>
                    <FileText className="w-4 h-4 mr-1" />
                    Review
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selectedRequest && (
        <ReviewDialog
          request={selectedRequest}
          open={!!selectedRequest}
          onOpenChange={(open) => { if (!open) setSelectedRequest(null); }}
        />
      )}
    </div>
  );
}
