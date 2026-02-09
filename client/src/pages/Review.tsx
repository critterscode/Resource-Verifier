import { useState } from "react";
import { useResources, useUpdateResource, useTags } from "@/hooks/use-resources";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertOctagon, 
  Phone, 
  Globe, 
  MapPin, 
  Clock,
  Edit,
  Mail,
  Shield,
  Map,
  DoorOpen,
  Tag,
  X,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ResourceForm } from "@/components/ResourceForm";
import type { Resource } from "@shared/schema";

function makeWebsiteUrl(website: string): string {
  if (!website) return '';
  if (website.startsWith('http://') || website.startsWith('https://')) return website;
  return `https://${website}`;
}

export default function Review() {
  const { data: resources, isLoading } = useResources();
  const { data: existingTags } = useTags();
  const updateMutation = useUpdateResource();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const reviewQueue = resources || [];
  const currentResource = reviewQueue[currentIndex];

  const handleNext = () => {
    if (currentIndex < reviewQueue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const updateStatus = (status: "verified" | "missing_info") => {
    if (currentResource) {
      updateMutation.mutate({ 
        id: currentResource.id, 
        updates: { status } 
      });
    }
  };

  const toggleTagOnCurrent = (tag: string) => {
    if (!currentResource) return;
    const currentTags = currentResource.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    updateMutation.mutate({ id: currentResource.id, updates: { tags: newTags } });
  };

  const handleUpdate = async (data: any) => {
    if (!editingResource) return;
    await updateMutation.mutateAsync({ id: editingResource.id, updates: data });
    setEditingResource(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentResource) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold">All caught up!</h2>
        <p className="text-muted-foreground mt-2">No resources left to review.</p>
      </div>
    );
  }

  const currentTags = currentResource.tags || [];

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto py-6 space-y-4">
       <div className="flex items-center justify-between">
         <h1 className="text-2xl font-display font-bold" data-testid="text-review-title">Review Mode</h1>
         <div className="text-sm text-muted-foreground font-medium" data-testid="text-review-counter">
            {currentIndex + 1} / {reviewQueue.length}
         </div>
       </div>

       <div className="flex-1 relative">
         <AnimatePresence mode="wait">
           <motion.div
             key={currentResource.id}
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             transition={{ duration: 0.2 }}
             className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden h-full flex flex-col"
           >
              {/* Header */}
              <div className="bg-muted/30 p-6 border-b border-border">
                 <div className="flex justify-between items-start">
                   <div>
                     <StatusBadge status={currentResource.status} className="mb-2" />
                     <h2 className="text-2xl font-bold text-foreground mb-1">
                       <a 
                         href={`https://www.google.com/search?q=${encodeURIComponent(currentResource.name)}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="hover:text-primary hover:underline inline-flex items-center gap-2"
                         data-testid="link-review-name"
                       >
                         {currentResource.name}
                         <ExternalLink className="w-4 h-4 opacity-40" />
                       </a>
                     </h2>
                     <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                        {currentResource.category}
                     </span>
                     {currentResource.categories && currentResource.categories.length > 0 && (
                       <span className="ml-2 text-xs text-muted-foreground">
                         + {currentResource.categories.join(', ')}
                       </span>
                     )}
                   </div>
                   <Button variant="outline" size="icon" onClick={() => setEditingResource(currentResource)} data-testid="button-review-edit">
                      <Edit className="w-4 h-4" />
                   </Button>
                 </div>
              </div>

              {/* Content */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto flex-1">
                 <div className="space-y-4">
                    <div>
                       <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Services</h3>
                       <p className="text-sm leading-relaxed">{currentResource.services || "No services listed."}</p>
                    </div>

                    {currentResource.accessInfo && (
                      <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><DoorOpen className="w-3 h-3" /> Access</h3>
                        <p className="text-sm">{currentResource.accessInfo}</p>
                      </div>
                    )}

                    {currentResource.eligibility && (
                      <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Shield className="w-3 h-3" /> Eligibility</h3>
                        <p className="text-sm">{currentResource.eligibility}</p>
                      </div>
                    )}

                    {currentResource.notes && (
                      <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
                         <h3 className="text-xs font-bold text-amber-600 mb-1 flex items-center gap-1">
                            <AlertOctagon className="w-3 h-3" /> Internal Notes
                         </h3>
                         <p className="text-xs text-amber-800 dark:text-amber-200">{currentResource.notes}</p>
                      </div>
                    )}

                    {/* Quick Tags */}
                    <div>
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> Tags</h3>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {currentTags.map(tag => (
                          <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                            {tag}
                            <button onClick={() => toggleTagOnCurrent(tag)}><X className="w-3 h-3" /></button>
                          </Badge>
                        ))}
                      </div>
                      {existingTags && existingTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {existingTags.filter(t => !currentTags.includes(t)).slice(0, 15).map(tag => (
                            <button
                              key={tag}
                              onClick={() => toggleTagOnCurrent(tag)}
                              className="text-[10px] px-2 py-0.5 rounded border bg-muted/50 text-muted-foreground border-border hover:bg-muted transition-colors"
                              data-testid={`button-tag-${tag}`}
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <InfoRow icon={Phone} label="Phone" value={currentResource.phone} />
                    <InfoRow icon={Mail} label="Email" value={currentResource.email} />
                    <InfoRow icon={MapPin} label="Address" value={currentResource.address} />
                    
                    {currentResource.website ? (
                      <div className="flex items-center gap-3 text-foreground/80">
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                          <Globe className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase">Website</span>
                          <a 
                            href={makeWebsiteUrl(currentResource.website)}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-sm text-primary hover:underline truncate"
                            data-testid="link-review-website"
                          >
                            {currentResource.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <InfoRow icon={Globe} label="Website" value={null} />
                    )}
                    
                    <InfoRow icon={Clock} label="Hours" value={currentResource.hours} />
                    <InfoRow icon={Map} label="Service Area" value={currentResource.serviceArea} />
                 </div>
              </div>
              
              {/* Action Footer */}
              <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between gap-4 flex-wrap">
                 <Button variant="ghost" onClick={handlePrev} disabled={currentIndex === 0} data-testid="button-prev">
                    <ArrowLeft className="mr-2 w-4 h-4" /> Previous
                 </Button>

                 <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                      onClick={() => updateStatus("missing_info")}
                      data-testid="button-flag-missing"
                    >
                       <AlertOctagon className="mr-2 w-4 h-4" /> Missing Info
                    </Button>
                    <Button 
                      className="bg-green-600 text-white"
                      onClick={() => updateStatus("verified")}
                      data-testid="button-verify"
                    >
                       <CheckCircle className="mr-2 w-4 h-4" /> Verified
                    </Button>
                 </div>

                 <Button variant="ghost" onClick={handleNext} disabled={currentIndex === reviewQueue.length - 1} data-testid="button-next">
                    Next <ArrowRight className="ml-2 w-4 h-4" />
                 </Button>
              </div>
           </motion.div>
         </AnimatePresence>
       </div>

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

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center gap-3 text-foreground/80">
      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] text-muted-foreground font-semibold uppercase">{label}</span>
        <span className="font-medium text-sm truncate">{value || "N/A"}</span>
      </div>
    </div>
  );
}
