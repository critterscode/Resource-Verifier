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
  Globe
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

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

  // Group items by category for the print view
  const groupedItems = useMemo(() => {
    if (!collection?.resources) return {};
    return collection.resources.reduce((acc, item) => {
      const cat = item.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, typeof collection.resources>);
  }, [collection]);

  const availableResources = allResources?.filter(
    r => !collection?.resources.some(cr => cr.id === r.id) && 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) return <div className="p-8 text-center">Loading list...</div>;
  if (!collection) return <div className="p-8 text-center">List not found</div>;

  return (
    <div className="space-y-6">
      {/* Screen Header - Hidden on Print */}
      <div className="no-print flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/lists">
            <Button variant="ghost" size="icon">
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
               <Button variant="outline">
                 <Plus className="w-4 h-4 mr-2" /> Add Items
               </Button>
             </DialogTrigger>
             <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
               <DialogHeader>
                 <DialogTitle>Add Resources to List</DialogTitle>
               </DialogHeader>
               <div className="p-2">
                 <div className="relative mb-4">
                   <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                   <Input 
                     placeholder="Search resources..." 
                     className="pl-9"
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                   />
                 </div>
                 <div className="overflow-y-auto max-h-[50vh] space-y-2">
                   {availableResources.map(r => (
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

           <Button onClick={handlePrint}>
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
          collection.resources.map(item => (
            <div key={item.id} className="bg-card border border-border p-4 rounded-xl flex items-center justify-between group">
               <div>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.services}</p>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    {item.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {item.phone}</span>}
                    {item.category && <span className="bg-secondary px-2 py-0.5 rounded text-xs text-secondary-foreground">{item.category}</span>}
                  </div>
               </div>
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                 onClick={() => handleRemove(item.id)}
               >
                 <Trash2 className="w-4 h-4" />
               </Button>
            </div>
          ))
        )}
      </div>

      {/* PRINT LAYOUT - Hidden on Screen */}
      <div className="print-only hidden">
         <div className="mb-8 text-center border-b-2 border-black pb-4">
            <h1 className="text-3xl font-bold uppercase tracking-wider">{collection.name}</h1>
            <p className="text-sm mt-2 italic">{collection.description}</p>
         </div>

         <div className="space-y-8">
            {Object.entries(groupedItems).map(([category, items]) => (
               <div key={category} className="break-inside-avoid">
                  <div className="bg-primary text-white font-bold uppercase px-4 py-2 text-sm mb-4 print-color-adjust-exact">
                     {category}
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                     {items.map(item => (
                        <div key={item.id} className="break-inside-avoid">
                           <div className="font-bold uppercase text-sm mb-1">{item.name}</div>
                           <div className="text-xs mb-2 space-y-0.5">
                              {item.phone && <div><strong>Tel:</strong> {item.phone}</div>}
                              {item.address && <div>{item.address}</div>}
                              {item.website && <div>{item.website}</div>}
                           </div>
                           <div className="text-xs leading-snug opacity-80">
                              {item.services}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            ))}
         </div>
         
         <div className="fixed bottom-0 left-0 right-0 text-center text-[10px] text-gray-400 border-t pt-2">
            Generated by ResourceHub on {new Date().toLocaleDateString()}
         </div>
      </div>
    </div>
  );
}
