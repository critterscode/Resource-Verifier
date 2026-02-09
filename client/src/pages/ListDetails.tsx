import { useParams, Link } from "wouter";
import { useCollection, useRemoveCollectionItem, useAddCollectionItem } from "@/hooks/use-collections";
import { useResources } from "@/hooks/use-resources";
import { Button } from "@/components/ui/button";
import { 
  Printer, 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Search,
  Phone,
  Globe,
  ExternalLink,
  Mail,
  Tag
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

function makeWebsiteUrl(website: string): string {
  if (!website) return '';
  if (website.startsWith('http://') || website.startsWith('https://')) return website;
  return `https://${website}`;
}

export default function ListDetails() {
  const { id } = useParams();
  const listId = Number(id);
  const { data: collection, isLoading } = useCollection(listId);
  const { data: allResources } = useResources();
  
  const removeMutation = useRemoveCollectionItem();
  const addMutation = useAddCollectionItem();
  
  const [searchTerm, setSearchTerm] = useState("");

  const handlePrint = () => {
    window.print();
  };

  const handleAdd = (resourceId: number) => {
    addMutation.mutate({ collectionId: listId, resourceId });
  };

  const handleRemove = (resourceId: number) => {
    removeMutation.mutate({ collectionId: listId, resourceId });
  };

  const groupedItems = useMemo(() => {
    if (!collection?.resources) return {};
    return collection.resources.reduce((acc: Record<string, any[]>, item: any) => {
      const cat = item.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, any[]>);
  }, [collection]);

  const availableResources = allResources?.filter(
    (r: any) => !collection?.resources.some((cr: any) => cr.id === r.id) && 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) return <div className="p-8 text-center">Loading list...</div>;
  if (!collection) return <div className="p-8 text-center">List not found</div>;

  return (
    <div className="space-y-6">
      {/* Screen Header */}
      <div className="no-print flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/lists">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold">{collection.name}</h1>
            <p className="text-muted-foreground">{collection.description}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
           <Dialog>
             <DialogTrigger asChild>
               <Button variant="outline" data-testid="button-add-items">
                 <Plus className="w-4 h-4 mr-2" /> Add Items
               </Button>
             </DialogTrigger>
             <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
               <DialogHeader>
                 <DialogTitle>Add Resources to List</DialogTitle>
                 <DialogDescription>Search and add resources to this collection.</DialogDescription>
               </DialogHeader>
               <div className="p-2">
                 <div className="relative mb-4">
                   <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                   <Input 
                     data-testid="input-search-add"
                     placeholder="Search resources..." 
                     className="pl-9"
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                   />
                 </div>
                 <div className="overflow-y-auto max-h-[50vh] space-y-2">
                   {availableResources.map((r: any) => (
                     <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                       <div>
                         <div className="font-semibold">{r.name}</div>
                         <div className="text-xs text-muted-foreground">{r.category}</div>
                       </div>
                       <Button size="sm" onClick={() => handleAdd(r.id)} disabled={addMutation.isPending}>
                         Add
                       </Button>
                     </div>
                   ))}
                 </div>
               </div>
             </DialogContent>
           </Dialog>

           <Button onClick={handlePrint} data-testid="button-print">
             <Printer className="w-4 h-4 mr-2" /> Print View
           </Button>
        </div>
      </div>

      {/* Screen View List */}
      <div className="no-print grid grid-cols-1 gap-4">
        {collection.resources.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
            This list is empty. Add resources to get started.
          </div>
        ) : (
          collection.resources.map((item: any) => (
            <div key={item.id} className="bg-card border border-border p-4 rounded-xl flex items-center justify-between group" data-testid={`card-list-item-${item.id}`}>
               <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-lg">
                    <a 
                      href={`https://www.google.com/search?q=${encodeURIComponent(item.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {item.name}
                      <ExternalLink className="w-3 h-3 opacity-30" />
                    </a>
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.services}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                    {item.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {item.phone}</span>}
                    {item.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {item.email}</span>}
                    {item.website && (
                      <a href={makeWebsiteUrl(item.website)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                        <Globe className="w-3 h-3" /> {item.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                    {item.category && <span className="bg-secondary px-2 py-0.5 rounded text-xs text-secondary-foreground">{item.category}</span>}
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {item.tags.map((tag: string) => (
                        <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          <Tag className="w-2.5 h-2.5" />{tag}
                        </span>
                      ))}
                    </div>
                  )}
               </div>
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
                 style={{ visibility: 'visible' }}
                 onClick={() => handleRemove(item.id)}
                 data-testid={`button-remove-${item.id}`}
               >
                 <Trash2 className="w-4 h-4" />
               </Button>
            </div>
          ))
        )}
      </div>

      {/* PRINT LAYOUT */}
      <div className="print-only hidden">
         <div className="mb-6 text-center border-b-2 border-black pb-3">
            <h1 className="text-2xl font-bold uppercase tracking-wider">{collection.name}</h1>
            <p className="text-xs mt-1 italic">{collection.description}</p>
         </div>

         <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, items]) => (
               <div key={category} className="break-inside-avoid">
                  <div className="bg-[#4a6b8a] text-white font-bold uppercase px-4 py-2 text-xs mb-3" style={{ backgroundColor: '#4a6b8a', color: 'white', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                     {category}
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                     {(items as any[]).map((item: any) => (
                        <div key={item.id} className="break-inside-avoid text-[11px]">
                           <div className="font-bold uppercase text-xs mb-0.5">{item.name}</div>
                           <div className="space-y-0.5 mb-1">
                              {item.phone && <div><strong>Phone:</strong> {item.phone}</div>}
                              {item.email && <div><strong>Email:</strong> {item.email}</div>}
                              {item.website && <div><strong>Web:</strong> {item.website}</div>}
                              {item.address && <div><strong>Address:</strong> {item.address}</div>}
                           </div>
                           {item.services && <div className="leading-snug opacity-80 mb-0.5"><strong>Services:</strong> {item.services}</div>}
                           {item.hours && <div><strong>Hours:</strong> {item.hours}</div>}
                           {item.eligibility && <div><strong>Eligibility:</strong> {item.eligibility}</div>}
                           {item.accessInfo && <div><strong>Access:</strong> {item.accessInfo}</div>}
                           {item.serviceArea && <div><strong>Area:</strong> {item.serviceArea}</div>}
                        </div>
                     ))}
                  </div>
               </div>
            ))}
         </div>
         
         <div className="fixed bottom-0 left-0 right-0 text-center text-[9px] text-gray-400 border-t pt-1">
            Generated by ResourceHub on {new Date().toLocaleDateString()}
         </div>
      </div>
    </div>
  );
}
