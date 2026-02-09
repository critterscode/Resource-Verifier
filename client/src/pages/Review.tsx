import { useState, useCallback, useEffect } from "react";
import { useResources, useUpdateResource, useTags, useCategories } from "@/hooks/use-resources";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Mail,
  Shield,
  Map,
  DoorOpen,
  Tag,
  X,
  ExternalLink,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Resource } from "@shared/schema";

function makeWebsiteUrl(website: string): string {
  if (!website) return '';
  if (website.startsWith('http://') || website.startsWith('https://')) return website;
  return `https://${website}`;
}

function InlineInput({ 
  value, 
  onSave, 
  placeholder,
  icon: Icon,
  label,
  testId,
}: { 
  value: string | null | undefined; 
  onSave: (val: string) => void; 
  placeholder: string;
  icon: any;
  label: string;
  testId: string;
}) {
  const [local, setLocal] = useState(value || "");
  const dirty = local !== (value || "");

  useEffect(() => {
    setLocal(value || "");
  }, [value]);

  const handleBlur = () => {
    if (dirty) onSave(local);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (dirty) onSave(local);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-muted-foreground font-semibold uppercase block leading-tight">{label}</span>
        <Input
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          data-testid={testId}
          className={`h-7 text-sm border-0 border-b border-transparent focus:border-primary bg-transparent px-0 rounded-none shadow-none focus-visible:ring-0 ${dirty ? 'border-b-primary/50' : ''}`}
        />
      </div>
    </div>
  );
}

function InlineTextarea({
  value,
  onSave,
  placeholder,
  label,
  testId,
  rows = 2,
}: {
  value: string | null | undefined;
  onSave: (val: string) => void;
  placeholder: string;
  label: string;
  testId: string;
  rows?: number;
}) {
  const [local, setLocal] = useState(value || "");
  const dirty = local !== (value || "");

  useEffect(() => {
    setLocal(value || "");
  }, [value]);

  const handleBlur = () => {
    if (dirty) onSave(local);
  };

  return (
    <div>
      <span className="text-[10px] text-muted-foreground font-semibold uppercase block mb-1">{label}</span>
      <Textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        data-testid={testId}
        rows={rows}
        className={`text-sm border border-transparent focus:border-primary bg-muted/20 rounded-md shadow-none focus-visible:ring-0 resize-none ${dirty ? 'border-primary/50' : ''}`}
      />
    </div>
  );
}

function InlineNameInput({
  value,
  onSave,
  testId,
}: {
  value: string;
  onSave: (val: string) => void;
  testId: string;
}) {
  const [local, setLocal] = useState(value);
  const dirty = local !== value;

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleBlur = () => {
    if (dirty) onSave(local);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (dirty) onSave(local);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <Input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      data-testid={testId}
      className={`text-lg font-bold border-0 border-b border-transparent focus:border-primary bg-transparent px-1 rounded-none shadow-none focus-visible:ring-0 h-auto py-0 ${dirty ? 'border-b-primary/50' : ''}`}
    />
  );
}

export default function Review() {
  const { data: resources, isLoading } = useResources();
  const { data: existingTags } = useTags();
  const { data: existingCategories } = useCategories();
  const updateMutation = useUpdateResource();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newTag, setNewTag] = useState("");

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

  const saveField = useCallback((field: string, value: any) => {
    if (!currentResource) return;
    updateMutation.mutate({ id: currentResource.id, updates: { [field]: value } });
  }, [currentResource, updateMutation]);

  const updateStatus = (status: "verified" | "missing_info") => {
    if (currentResource) {
      updateMutation.mutate({ 
        id: currentResource.id, 
        updates: { status } 
      });
      handleNext();
    }
  };

  const toggleTagOnCurrent = (tag: string) => {
    if (!currentResource) return;
    const currentTags = currentResource.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t: string) => t !== tag)
      : [...currentTags, tag];
    updateMutation.mutate({ id: currentResource.id, updates: { tags: newTags } });
  };

  const addCustomTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && currentResource) {
      const currentTags = currentResource.tags || [];
      if (!currentTags.includes(trimmed)) {
        updateMutation.mutate({ id: currentResource.id, updates: { tags: [...currentTags, trimmed] } });
      }
      setNewTag("");
    }
  };

  const toggleCategory = (cat: string) => {
    if (!currentResource) return;
    const current = currentResource.categories || [];
    const updated = current.includes(cat)
      ? current.filter((c: string) => c !== cat)
      : current.length >= 2 ? current : [...current, cat];
    updateMutation.mutate({ id: currentResource.id, updates: { categories: updated } });
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
  const currentCats = currentResource.categories || [];

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto py-4 px-2 space-y-3">
       <div className="flex items-center justify-between">
         <h1 className="text-xl font-display font-bold" data-testid="text-review-title">Review Mode</h1>
         <div className="flex items-center gap-3">
           <StatusBadge status={currentResource.status} />
           <div className="text-sm text-muted-foreground font-medium" data-testid="text-review-counter">
              {currentIndex + 1} / {reviewQueue.length}
           </div>
         </div>
       </div>

       <div className="flex-1 relative overflow-hidden">
         <AnimatePresence mode="wait">
           <motion.div
             key={currentResource.id}
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             transition={{ duration: 0.15 }}
             className="bg-card border border-border rounded-md shadow-sm overflow-hidden h-full flex flex-col"
           >
              {/* Header - Name & Category inline editable */}
              <div className="bg-muted/30 px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3 mb-2">
                  <a 
                    href={`https://www.google.com/search?q=${encodeURIComponent(currentResource.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex-shrink-0"
                    data-testid="link-review-name"
                    title="Search on Google"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <InlineNameInput
                    key={`name-${currentResource.id}`}
                    value={currentResource.name}
                    onSave={(val) => saveField('name', val)}
                    testId="input-review-name"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Input
                    defaultValue={currentResource.category}
                    key={`cat-${currentResource.id}`}
                    onBlur={(e) => {
                      if (e.target.value !== currentResource.category) {
                        saveField('category', e.target.value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                    placeholder="Primary category..."
                    data-testid="input-review-category"
                    className="h-7 text-xs font-medium w-40 bg-primary/10 text-primary border-0 rounded-md px-2 shadow-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  {existingCategories && existingCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {existingCategories.slice(0, 12).map((cat: string) => (
                        <button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          disabled={currentCats.length >= 2 && !currentCats.includes(cat)}
                          data-testid={`button-review-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                          className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                            currentCats.includes(cat)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : currentCats.length >= 2
                                ? 'bg-muted/20 text-muted-foreground/40 border-border cursor-not-allowed'
                                : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Content - All fields editable */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1">
                <div className="space-y-3">
                  <InlineTextarea
                    key={`svc-${currentResource.id}`}
                    value={currentResource.services}
                    onSave={(val) => saveField('services', val)}
                    placeholder="Services description..."
                    label="Services / Description"
                    testId="input-review-services"
                    rows={3}
                  />

                  <InlineTextarea
                    key={`acc-${currentResource.id}`}
                    value={currentResource.accessInfo}
                    onSave={(val) => saveField('accessInfo', val)}
                    placeholder="Walk-in, appointment, referral..."
                    label="Access"
                    testId="input-review-access"
                    rows={2}
                  />

                  <InlineTextarea
                    key={`elig-${currentResource.id}`}
                    value={currentResource.eligibility}
                    onSave={(val) => saveField('eligibility', val)}
                    placeholder="Eligibility requirements..."
                    label="Eligibility"
                    testId="input-review-eligibility"
                    rows={2}
                  />

                  <InlineTextarea
                    key={`notes-${currentResource.id}`}
                    value={currentResource.notes}
                    onSave={(val) => saveField('notes', val)}
                    placeholder="Internal notes..."
                    label="Notes"
                    testId="input-review-notes"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <InlineInput
                    key={`ph-${currentResource.id}`}
                    value={currentResource.phone}
                    onSave={(val) => saveField('phone', val)}
                    placeholder="(555) 123-4567"
                    icon={Phone}
                    label="Phone"
                    testId="input-review-phone"
                  />
                  <InlineInput
                    key={`em-${currentResource.id}`}
                    value={currentResource.email}
                    onSave={(val) => saveField('email', val)}
                    placeholder="contact@example.com"
                    icon={Mail}
                    label="Email"
                    testId="input-review-email"
                  />
                  <InlineInput
                    key={`addr-${currentResource.id}`}
                    value={currentResource.address}
                    onSave={(val) => saveField('address', val)}
                    placeholder="123 Main St..."
                    icon={MapPin}
                    label="Address"
                    testId="input-review-address"
                  />
                  <InlineInput
                    key={`web-${currentResource.id}`}
                    value={currentResource.website}
                    onSave={(val) => saveField('website', val)}
                    placeholder="www.example.com"
                    icon={Globe}
                    label="Website"
                    testId="input-review-website"
                  />
                  {currentResource.website && (
                    <div className="pl-9">
                      <a 
                        href={makeWebsiteUrl(currentResource.website)}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        data-testid="link-review-website"
                      >
                        Open site <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  <InlineInput
                    key={`hrs-${currentResource.id}`}
                    value={currentResource.hours}
                    onSave={(val) => saveField('hours', val)}
                    placeholder="Mon-Fri 9am-5pm"
                    icon={Clock}
                    label="Hours"
                    testId="input-review-hours"
                  />
                  <InlineInput
                    key={`sa-${currentResource.id}`}
                    value={currentResource.serviceArea}
                    onSave={(val) => saveField('serviceArea', val)}
                    placeholder="Eugene/Springfield"
                    icon={Map}
                    label="Service Area"
                    testId="input-review-service-area"
                  />

                  {/* Tags section */}
                  <div className="pt-2">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase block mb-1.5 flex items-center gap-1"><Tag className="w-3 h-3" /> Tags</span>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {currentTags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="gap-1 text-[10px] py-0">
                          {tag}
                          <button onClick={() => toggleTagOnCurrent(tag)} data-testid={`button-review-tag-remove-${tag.replace(/\s+/g, '-').toLowerCase()}`}><X className="w-2.5 h-2.5" /></button>
                        </Badge>
                      ))}
                    </div>
                    {existingTags && existingTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {existingTags.filter((t: string) => !currentTags.includes(t)).slice(0, 12).map((tag: string) => (
                          <button
                            key={tag}
                            onClick={() => toggleTagOnCurrent(tag)}
                            className="text-[10px] px-1.5 py-0.5 rounded border bg-muted/40 text-muted-foreground border-border hover:bg-muted transition-colors"
                            data-testid={`button-review-tag-add-${tag.replace(/\s+/g, '-').toLowerCase()}`}
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1">
                      <Input 
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); }}}
                        placeholder="New tag..."
                        data-testid="input-review-new-tag"
                        className="h-6 text-xs flex-1"
                      />
                      <Button type="button" variant="outline" size="icon" onClick={addCustomTag} className="h-6 w-6" data-testid="button-review-add-tag">
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Footer */}
              <div className="px-4 py-3 border-t border-border bg-muted/10 flex items-center justify-between gap-4 flex-wrap">
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
    </div>
  );
}
