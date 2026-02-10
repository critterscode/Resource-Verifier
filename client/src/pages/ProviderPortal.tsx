import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import type { Provider, Resource, UpdateRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Link as LinkIcon,
} from "lucide-react";

const EDITABLE_FIELDS = [
  { key: "phone", label: "Phone", icon: Phone },
  { key: "email", label: "Email", icon: Mail },
  { key: "website", label: "Website", icon: Globe },
  { key: "address", label: "Address", icon: MapPin },
  { key: "hours", label: "Hours", icon: Clock },
  { key: "services", label: "Services", icon: FileText },
  { key: "eligibility", label: "Eligibility", icon: FileText },
  { key: "accessInfo", label: "Access Info", icon: FileText },
] as const;

function StatusBadge({ status }: { status: string | null }) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    new: { label: "Pending", variant: "secondary" },
    in_review: { label: "In Review", variant: "outline" },
    accepted: { label: "Accepted", variant: "default" },
    rejected: { label: "Rejected", variant: "destructive" },
  };
  const c = config[status || "new"] || config.new;
  return <Badge variant={c.variant} data-testid={`badge-request-status-${status}`}>{c.label}</Badge>;
}

function UpdateRequestForm({
  resource,
  providerEmail,
  open,
  onOpenChange,
}: {
  resource: Resource;
  providerEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [changes, setChanges] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [evidenceLink, setEvidenceLink] = useState("");

  const hasChanges = Object.keys(changes).length > 0;

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", api.updateRequests.create.path, {
        resourceId: resource.id,
        submittedBy: providerEmail,
        proposedChanges: changes,
        notes: notes || undefined,
        evidenceLink: evidenceLink || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0].startsWith("/api/providers") || q.queryKey[0].startsWith("/api/update-requests")),
      });
      toast({ title: "Update request submitted", description: "Your proposed changes are now pending review." });
      setChanges({});
      setNotes("");
      setEvidenceLink("");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateField = (key: string, value: string) => {
    const currentVal = (resource as any)[key] || "";
    if (value === currentVal) {
      const next = { ...changes };
      delete next[key];
      setChanges(next);
    } else {
      setChanges({ ...changes, [key]: value });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="update-request-dialog">
        <DialogHeader>
          <DialogTitle>Propose Changes to {resource.name}</DialogTitle>
          <DialogDescription>Update the fields below with new information. Only changed fields will be submitted.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {EDITABLE_FIELDS.map(({ key, label, icon: Icon }) => {
            const currentValue = (resource as any)[key] || "";
            const isChanged = key in changes;
            return (
              <div key={key} className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  {label}
                  {isChanged && <Badge variant="secondary" className="text-xs">Changed</Badge>}
                </label>
                <div className="text-xs text-muted-foreground mb-1">
                  Current: {currentValue || "(empty)"}
                </div>
                {key === "services" || key === "eligibility" || key === "accessInfo" || key === "hours" ? (
                  <Textarea
                    defaultValue={currentValue}
                    onChange={(e) => updateField(key, e.target.value)}
                    className="text-sm"
                    data-testid={`input-update-${key}`}
                  />
                ) : (
                  <Input
                    defaultValue={currentValue}
                    onChange={(e) => updateField(key, e.target.value)}
                    data-testid={`input-update-${key}`}
                  />
                )}
              </div>
            );
          })}

          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              Notes for Reviewer
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context about these changes..."
              className="text-sm"
              data-testid="input-update-notes"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
              Evidence Link (optional)
            </label>
            <Input
              value={evidenceLink}
              onChange={(e) => setEvidenceLink(e.target.value)}
              placeholder="URL to supporting evidence (website, document, etc.)"
              data-testid="input-update-evidence"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-update-cancel">
            Cancel
          </Button>
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={!hasChanges || submitMutation.isPending}
            data-testid="button-update-submit"
          >
            {submitMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Submit Changes ({Object.keys(changes).length} field{Object.keys(changes).length !== 1 ? "s" : ""})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ProviderPortal() {
  const { toast } = useToast();
  const [emailInput, setEmailInput] = useState("");
  const [provider, setProvider] = useState<Provider | null>(null);
  const [updateResource, setUpdateResource] = useState<Resource | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [regName, setRegName] = useState("");
  const [regContact, setRegContact] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");

  const resourcesUrl = provider ? `/api/providers/${provider.id}/resources` : null;
  const requestsUrl = provider ? `/api/providers/${provider.id}/update-requests` : null;

  const resourcesQuery = useQuery<Resource[]>({
    queryKey: [resourcesUrl!],
    enabled: !!provider,
  });

  const requestsQuery = useQuery<(UpdateRequest & { resourceName?: string })[]>({
    queryKey: [requestsUrl!],
    enabled: !!provider,
  });

  const lookupMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", api.providers.lookup.path, { email });
      return res.json();
    },
    onSuccess: (data: Provider) => {
      setProvider(data);
      toast({ title: `Welcome back, ${data.orgName}` });
    },
    onError: () => {
      toast({
        title: "Provider not found",
        description: "No provider account found with that email. You can register below.",
        variant: "destructive",
      });
      setShowRegister(true);
      setRegEmail(emailInput);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", api.providers.register.path, {
        orgName: regName,
        contactName: regContact || undefined,
        email: regEmail,
        phone: regPhone || undefined,
      });
      return res.json();
    },
    onSuccess: (data: Provider) => {
      setProvider(data);
      setShowRegister(false);
      toast({ title: "Registration successful", description: `Welcome, ${data.orgName}! Your account is pending verification by staff.` });
    },
    onError: (err: any) => {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    },
  });

  const providerResources = resourcesQuery.data || [];
  const providerRequests = requestsQuery.data || [];

  if (!provider) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <Building2 className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold font-display" data-testid="text-provider-portal-title">Provider Portal</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-lg">
          <Card className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <Building2 className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-lg font-semibold">Provider Self-Service</h2>
              <p className="text-sm text-muted-foreground">
                Look up your organization to view and update your resource listings.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Organization Email</label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@organization.org"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && emailInput && lookupMutation.mutate(emailInput)}
                  data-testid="input-provider-email"
                />
                <Button
                  onClick={() => lookupMutation.mutate(emailInput)}
                  disabled={!emailInput || lookupMutation.isPending}
                  data-testid="button-provider-lookup"
                >
                  {lookupMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {showRegister && (
              <div className="border-t border-border pt-4 space-y-3" data-testid="provider-register-form">
                <h3 className="text-sm font-semibold">Register New Provider</h3>
                <div className="space-y-2">
                  <Input
                    placeholder="Organization Name *"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    data-testid="input-register-name"
                  />
                  <Input
                    placeholder="Contact Person"
                    value={regContact}
                    onChange={(e) => setRegContact(e.target.value)}
                    data-testid="input-register-contact"
                  />
                  <Input
                    type="email"
                    placeholder="Email *"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    data-testid="input-register-email"
                  />
                  <Input
                    placeholder="Phone"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    data-testid="input-register-phone"
                  />
                </div>
                <Button
                  onClick={() => registerMutation.mutate()}
                  disabled={!regName || !regEmail || registerMutation.isPending}
                  className="w-full"
                  data-testid="button-register-submit"
                >
                  {registerMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Building2 className="w-4 h-4 mr-2" />
                  )}
                  Register Organization
                </Button>
              </div>
            )}
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold font-display" data-testid="text-provider-portal-title">Provider Portal</h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" data-testid="text-provider-org">{provider.orgName}</Badge>
            <Badge variant="secondary" data-testid="text-provider-email">{provider.email}</Badge>
            {provider.verified ? (
              <Badge variant="default" data-testid="badge-provider-verified">
                <CheckCircle className="w-3 h-3 mr-1" />Verified
              </Badge>
            ) : (
              <Badge variant="secondary" data-testid="badge-provider-pending">Pending Verification</Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => setProvider(null)} data-testid="button-provider-logout">
              <ArrowLeft className="w-4 h-4 mr-1" />Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" data-testid="text-resources-heading">
            Your Resources
            <Badge variant="secondary">{providerResources.length}</Badge>
          </h2>

          {resourcesQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : providerResources.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No resources are currently linked to your provider account.</p>
              <p className="text-xs mt-1">Contact staff to link your resources.</p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {providerResources.map((resource) => (
                <Card key={resource.id} className="p-4" data-testid={`resource-card-${resource.id}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="font-medium truncate" data-testid={`text-resource-name-${resource.id}`}>{resource.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{resource.category}</Badge>
                        <Badge
                          variant={resource.status === "verified" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {resource.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {resource.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{resource.phone}</div>}
                        {resource.address && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{resource.address}</div>}
                        {resource.hours && <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{resource.hours}</div>}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setUpdateResource(resource)}
                      data-testid={`button-propose-update-${resource.id}`}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Propose Update
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" data-testid="text-requests-heading">
            Your Update Requests
            <Badge variant="secondary">{providerRequests.length}</Badge>
          </h2>

          {requestsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : providerRequests.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No update requests submitted yet.</p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {providerRequests.map((req) => {
                const changedFields = req.proposedChanges ? Object.keys(req.proposedChanges as Record<string, any>) : [];
                return (
                  <Card key={req.id} className="p-4" data-testid={`request-card-${req.id}`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-1">
                        <div className="font-medium text-sm" data-testid={`text-request-resource-${req.id}`}>
                          {req.resourceName || `Resource #${req.resourceId}`}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={req.status} />
                          <span className="text-xs text-muted-foreground">
                            {changedFields.length} field{changedFields.length !== 1 ? "s" : ""} changed
                          </span>
                        </div>
                        {changedFields.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {changedFields.map((f) => (
                              <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                            ))}
                          </div>
                        )}
                        {req.notes && <p className="text-xs text-muted-foreground">{req.notes}</p>}
                        {req.evidenceLink && (
                          <a href={req.evidenceLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" />Evidence
                          </a>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : ""}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {updateResource && (
        <UpdateRequestForm
          resource={updateResource}
          providerEmail={provider.email || ""}
          open={!!updateResource}
          onOpenChange={(open) => { if (!open) setUpdateResource(null); }}
        />
      )}
    </div>
  );
}
