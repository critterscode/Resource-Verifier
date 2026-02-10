import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, MapPin, Phone, Globe, Mail, Clock, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, HelpCircle, MinusCircle, Filter, X, Heart, Users, Info, Shield, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Resource } from "@shared/schema";

type PublicResource = Partial<Resource>;

const PAGE_SIZE = 50;

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const verifiedIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "verified-marker",
});

function VerifiedBadge({ status }: { status?: string }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" data-testid="badge-verified">
        <CheckCircle2 className="w-3 h-3" />
        Verified
      </span>
    );
  }
  if (status === "limited") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
        <MinusCircle className="w-3 h-3" />
        Limited
      </span>
    );
  }
  return null;
}

function ResourceDetailDialog({ resource, open, onClose }: { resource: PublicResource | null; open: boolean; onClose: () => void }) {
  if (!resource) return null;

  const websiteUrl = resource.website
    ? resource.website.startsWith("http") ? resource.website : `https://${resource.website}`
    : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap" data-testid="text-detail-name">
            {resource.name}
            <VerifiedBadge status={resource.status} />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" data-testid="text-detail-category">{resource.category}</Badge>
            {resource.tags?.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>

          {resource.services && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Services</h4>
              <p className="text-sm" data-testid="text-detail-services">{resource.services}</p>
            </div>
          )}

          <div className="grid gap-3">
            {resource.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <span className="text-sm" data-testid="text-detail-address">
                  {resource.address}
                  {resource.city && `, ${resource.city}`}
                  {resource.state && `, ${resource.state}`}
                  {resource.zip && ` ${resource.zip}`}
                </span>
              </div>
            )}
            {resource.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <a href={`tel:${resource.phone}`} className="text-sm text-primary hover:underline" data-testid="link-detail-phone">{resource.phone}</a>
              </div>
            )}
            {resource.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${resource.email}`} className="text-sm text-primary hover:underline" data-testid="link-detail-email">{resource.email}</a>
              </div>
            )}
            {websiteUrl && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate" data-testid="link-detail-website">{resource.website}</a>
              </div>
            )}
            {resource.hours && (
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <span className="text-sm" data-testid="text-detail-hours">{resource.hours}</span>
              </div>
            )}
          </div>

          {resource.eligibility && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Eligibility</h4>
              <p className="text-sm" data-testid="text-detail-eligibility">{resource.eligibility}</p>
            </div>
          )}
          {resource.accessInfo && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">How to Access</h4>
              <p className="text-sm" data-testid="text-detail-access">{resource.accessInfo}</p>
            </div>
          )}
          {resource.serviceArea && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Service Area</h4>
              <p className="text-sm" data-testid="text-detail-service-area">{resource.serviceArea}</p>
            </div>
          )}
          {resource.languages && resource.languages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Languages</h4>
              <div className="flex gap-1 flex-wrap">
                {resource.languages.map(lang => (
                  <Badge key={lang} variant="outline" className="text-xs">{lang}</Badge>
                ))}
              </div>
            </div>
          )}
          {resource.publicNotes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
              <p className="text-sm" data-testid="text-detail-notes">{resource.publicNotes}</p>
            </div>
          )}

          {resource.lastVerifiedAt && (
            <p className="text-xs text-muted-foreground">
              Last verified: {new Date(resource.lastVerifiedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResourceCard({ resource, onClick }: { resource: PublicResource; onClick: () => void }) {
  const websiteUrl = resource.website
    ? resource.website.startsWith("http") ? resource.website : `https://${resource.website}`
    : null;

  return (
    <Card
      className="hover-elevate cursor-pointer transition-all"
      onClick={onClick}
      data-testid={`card-resource-${resource.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-sm leading-tight" data-testid={`text-resource-name-${resource.id}`}>
            {resource.name}
          </h3>
          <VerifiedBadge status={resource.status} />
        </div>

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">{resource.category}</Badge>
        </div>

        {resource.services && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{resource.services}</p>
        )}

        <div className="space-y-1">
          {resource.address && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{resource.address}</span>
            </div>
          )}
          {resource.phone && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="w-3 h-3 shrink-0" />
              <span>{resource.phone}</span>
            </div>
          )}
          {resource.hours && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3 shrink-0" />
              <span className="truncate">{resource.hours}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PublicSearch() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedResource, setSelectedResource] = useState<PublicResource | null>(null);
  const [showMap, setShowMap] = useState(true);

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (categoryFilter !== "all") queryParams.set("category", categoryFilter);
  if (tagFilter !== "all") queryParams.set("tag", tagFilter);
  queryParams.set("limit", String(PAGE_SIZE));
  queryParams.set("offset", String(page * PAGE_SIZE));

  const countParams = new URLSearchParams();
  if (search) countParams.set("search", search);
  if (categoryFilter !== "all") countParams.set("category", categoryFilter);
  if (tagFilter !== "all") countParams.set("tag", tagFilter);

  const { data: resources = [], isLoading } = useQuery<PublicResource[]>({
    queryKey: ["/api/public/resources", `?${queryParams.toString()}`],
  });

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/public/resources/count", `?${countParams.toString()}`],
  });

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ["/api/public/categories"],
  });

  const { data: tags = [] } = useQuery<string[]>({
    queryKey: ["/api/public/tags"],
  });

  const totalCount = countData?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const mappableResources = useMemo(
    () => resources.filter(r => r.lat && r.lng),
    [resources]
  );

  const topCategories = useMemo(() => {
    const seen = new Map<string, boolean>();
    const unique: string[] = [];
    for (const cat of categories) {
      if (!seen.has(cat)) {
        seen.set(cat, true);
        unique.push(cat);
      }
    }
    return unique.slice(0, 50);
  }, [categories]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60" data-testid="text-lanehelp-title">
                LaneHelp
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline" data-testid="text-resource-count">
                {totalCount.toLocaleString()} resources
              </span>
              <Button
                variant={showMap ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMap(!showMap)}
                data-testid="button-toggle-map"
              >
                <MapPin className="w-4 h-4 mr-1" />
                Map
              </Button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9"
                data-testid="input-public-search"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[200px]" data-testid="select-public-category">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="All Categories" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {topCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tagFilter} onValueChange={(v) => { setTagFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[180px]" data-testid="select-public-tag">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
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
            {(search || categoryFilter !== "all" || tagFilter !== "all") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setSearch(""); setCategoryFilter("all"); setTagFilter("all"); setPage(0); }}
                data-testid="button-clear-filters"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {showMap && (
          <div className="h-[300px] lg:h-auto lg:flex-1 border-b lg:border-b-0 lg:border-r border-border" data-testid="panel-map">
            {mappableResources.length > 0 ? (
              <MapContainer
                center={[mappableResources[0].lat!, mappableResources[0].lng!]}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mappableResources.map(r => (
                  <Marker
                    key={r.id}
                    position={[r.lat!, r.lng!]}
                    icon={r.status === "verified" ? verifiedIcon : defaultIcon}
                    eventHandlers={{
                      click: () => setSelectedResource(r),
                    }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>{r.name}</strong>
                        {r.address && <p className="text-xs mt-1">{r.address}</p>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                <MapPin className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Map pins appear as coordinates are added</p>
                <p className="text-xs mt-1">Resources are listed below</p>
              </div>
            )}
          </div>
        )}

        <div className={cn("flex-1 flex flex-col overflow-hidden", showMap ? "lg:max-w-md xl:max-w-lg" : "")}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-1/2 mb-2 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-full animate-pulse" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : resources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">No resources found</p>
                <p className="text-xs mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              resources.map(resource => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onClick={() => setSelectedResource(resource)}
                />
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 p-3 border-t border-border bg-background">
              <span className="text-xs text-muted-foreground" data-testid="text-public-pagination">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 0}
                  data-testid="button-public-prev"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-medium" data-testid="text-public-page">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1}
                  data-testid="button-public-next"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ResourceDetailDialog
        resource={selectedResource}
        open={!!selectedResource}
        onClose={() => setSelectedResource(null)}
      />
    </div>
  );
}
