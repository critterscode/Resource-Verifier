import { useState } from "react";
import { useResources, useUpdateResource } from "@/hooks/use-resources";
import { Button } from "@/components/ui/button";
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
  Edit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResourceForm } from "@/components/ResourceForm";
import type { Resource } from "@shared/routes";

export default function Review() {
  const { data: resources, isLoading } = useResources();
  const updateMutation = useUpdateResource();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  // Filter out verified ones if we only want to review unverified? 
  // Let's allow reviewing all for now, but maybe prioritize unverified.
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
      // Optionally auto-advance after marking
      // handleNext(); 
    }
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

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto py-6 space-y-6">
       <div className="flex items-center justify-between">
         <h1 className="text-2xl font-display font-bold">Review Mode</h1>
         <div className="text-sm text-muted-foreground font-medium">
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
             transition={{ duration: 0.3 }}
             className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden h-full flex flex-col"
           >
              {/* Header Card */}
              <div className="bg-muted/30 p-8 border-b border-border">
                 <div className="flex justify-between items-start">
                   <div>
                     <StatusBadge status={currentResource.status} className="mb-3" />
                     <h2 className="text-3xl font-bold text-foreground mb-2">{currentResource.name}</h2>
                     <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                        {currentResource.category}
                     </span>
                   </div>
                   <Button variant="outline" size="icon" onClick={() => setEditingResource(currentResource)}>
                      <Edit className="w-4 h-4" />
                   </Button>
                 </div>
              </div>

              {/* Content Body */}
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto flex-1">
                 <div className="space-y-6">
                    <div>
                       <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Services</h3>
                       <p className="text-lg leading-relaxed">{currentResource.services || "No services listed."}</p>
                    </div>
                    {currentResource.notes && (
                      <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                         <h3 className="text-sm font-bold text-amber-600 mb-1 flex items-center gap-2">
                            <AlertOctagon className="w-4 h-4" /> Internal Notes
                         </h3>
                         <p className="text-sm text-amber-800 dark:text-amber-200">{currentResource.notes}</p>
                      </div>
                    )}
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-foreground/80">
                         <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <Phone className="w-5 h-5 text-primary" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground font-semibold uppercase">Phone</span>
                            <span className="font-medium text-lg">{currentResource.phone || "N/A"}</span>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-foreground/80">
                         <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-primary" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground font-semibold uppercase">Address</span>
                            <span className="font-medium">{currentResource.address || "N/A"}</span>
                         </div>
                      </div>

                      <div className="flex items-center gap-3 text-foreground/80">
                         <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <Globe className="w-5 h-5 text-primary" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground font-semibold uppercase">Website</span>
                            <span className="font-medium truncate max-w-[200px]">{currentResource.website || "N/A"}</span>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-foreground/80">
                         <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <Clock className="w-5 h-5 text-primary" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground font-semibold uppercase">Hours</span>
                            <span className="font-medium">{currentResource.hours || "N/A"}</span>
                         </div>
                      </div>
                    </div>
                 </div>
              </div>
              
              {/* Action Footer */}
              <div className="p-6 border-t border-border bg-muted/10 flex items-center justify-between gap-4">
                 <Button variant="ghost" onClick={handlePrev} disabled={currentIndex === 0}>
                    <ArrowLeft className="mr-2 w-4 h-4" /> Previous
                 </Button>

                 <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800"
                      onClick={() => updateStatus("missing_info")}
                    >
                       <AlertOctagon className="mr-2 w-4 h-4" /> Flag Missing Info
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
                      onClick={() => updateStatus("verified")}
                    >
                       <CheckCircle className="mr-2 w-4 h-4" /> Mark Verified
                    </Button>
                 </div>

                 <Button variant="ghost" onClick={handleNext} disabled={currentIndex === reviewQueue.length - 1}>
                    Next <ArrowRight className="ml-2 w-4 h-4" />
                 </Button>
              </div>
           </motion.div>
         </AnimatePresence>
       </div>

       {/* Edit Modal Reuse */}
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
