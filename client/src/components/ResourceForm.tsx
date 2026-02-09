import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertResourceSchema } from "@shared/schema";
import type { Resource } from "@shared/schema";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X, Plus } from "lucide-react";
import { useCategories, useTags } from "@/hooks/use-resources";

type FormValues = z.infer<typeof insertResourceSchema>;

interface ResourceFormProps {
  initialData?: Resource;
  onSubmit: (data: FormValues) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function ResourceForm({ initialData, onSubmit, isSubmitting, onCancel }: ResourceFormProps) {
  const { data: existingCategories } = useCategories();
  const { data: existingTags } = useTags();
  
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);
  const [newTag, setNewTag] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.categories || []);

  const form = useForm<FormValues>({
    resolver: zodResolver(insertResourceSchema),
    defaultValues: initialData ? {
      ...initialData,
      tags: initialData.tags || [],
      categories: initialData.categories || [],
    } : {
      name: "",
      category: "",
      status: "unverified",
      phone: "",
      email: "",
      website: "",
      address: "",
      services: "",
      hours: "",
      notes: "",
      isFavorite: false,
      tags: [],
      categories: [],
      accessInfo: "",
      eligibility: "",
      serviceArea: "",
    },
  });

  useEffect(() => {
    form.setValue("tags", selectedTags);
  }, [selectedTags, form]);

  useEffect(() => {
    form.setValue("categories", selectedCategories);
  }, [selectedCategories, form]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags(prev => [...prev, trimmed]);
      setNewTag("");
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(cat)) return prev.filter(c => c !== cat);
      if (prev.length >= 2) return prev;
      return [...prev, cat];
    });
  };

  const handleFormSubmit = (data: FormValues) => {
    onSubmit({
      ...data,
      tags: selectedTags,
      categories: selectedCategories,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input data-testid="input-name" placeholder="Resource name..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Category</FormLabel>
                <FormControl>
                  <Input data-testid="input-category" placeholder="e.g. Housing, Food, Health" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="unverified">Unverified</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="needs_info">Needs Info</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="limited">Limited</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input data-testid="input-phone" placeholder="(555) 123-4567" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input data-testid="input-email" placeholder="contact@example.com" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input data-testid="input-website" placeholder="https://..." {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input data-testid="input-address" placeholder="123 Main St..." {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="services"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Services / Description</FormLabel>
              <FormControl>
                <Textarea data-testid="input-services" placeholder="List services offered..." className="h-20" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hours</FormLabel>
                <FormControl>
                  <Input data-testid="input-hours" placeholder="Mon-Fri 9am-5pm" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serviceArea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Area</FormLabel>
                <FormControl>
                  <Input data-testid="input-service-area" placeholder="Eugene/Springfield" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="accessInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Access Info</FormLabel>
              <FormControl>
                <Textarea data-testid="input-access-info" placeholder="Walk-in, appointment only, etc." className="h-16" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eligibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eligibility</FormLabel>
              <FormControl>
                <Textarea data-testid="input-eligibility" placeholder="Who qualifies for this service..." className="h-16" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Additional Categories (max 2) */}
        <div>
          <FormLabel className="mb-2 block">Additional Categories (max 2)</FormLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedCategories.map(cat => (
              <Badge key={cat} variant="default" className="gap-1">
                {cat}
                <button type="button" onClick={() => toggleCategory(cat)} data-testid={`button-category-remove-${cat.replace(/\s+/g, '-').toLowerCase()}`}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          {existingCategories && existingCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {existingCategories.slice(0, 20).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  disabled={selectedCategories.length >= 2 && !selectedCategories.includes(cat)}
                  data-testid={`button-category-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                    selectedCategories.includes(cat) 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : selectedCategories.length >= 2
                        ? 'bg-muted/30 text-muted-foreground/50 border-border cursor-not-allowed'
                        : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tags Quick Select */}
        <div>
          <FormLabel className="mb-2 block">Tags</FormLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedTags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button type="button" onClick={() => toggleTag(tag)} data-testid={`button-tag-remove-${tag.replace(/\s+/g, '-').toLowerCase()}`}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          {existingTags && existingTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {existingTags.filter(t => !selectedTags.includes(t)).slice(0, 30).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  data-testid={`button-tag-add-${tag.replace(/\s+/g, '-').toLowerCase()}`}
                  className="text-xs px-2.5 py-1 rounded-md border bg-muted/50 text-muted-foreground border-border hover:bg-muted transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input 
              data-testid="input-new-tag"
              placeholder="Add custom tag..." 
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); }}}
              className="flex-1"
            />
            <Button type="button" variant="outline" size="icon" onClick={addCustomTag}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Internal Notes</FormLabel>
              <FormControl>
                <Textarea data-testid="input-notes" placeholder="Any missing info details..." className="h-16" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} data-testid="button-submit">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Resource" : "Create Resource"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
