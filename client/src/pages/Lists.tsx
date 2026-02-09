import { useState } from "react";
import { Link } from "wouter";
import { useCollections, useCreateCollection } from "@/hooks/use-collections";
import { Plus, ListMusic, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";

export default function Lists() {
  const { data: collections, isLoading } = useCollections();
  const createMutation = useCreateCollection();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");

  const handleCreate = async () => {
    if (!newListName.trim()) return;
    await createMutation.mutateAsync({ name: newListName, description: newListDesc });
    setNewListName("");
    setNewListDesc("");
    setIsCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-display font-bold">My Lists</h1>
            <p className="text-muted-foreground">Create collections of resources to print or share.</p>
         </div>
         <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
               <Button className="shadow-lg shadow-primary/20">
                  <Plus className="w-4 h-4 mr-2" /> New List
               </Button>
            </DialogTrigger>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>Create New List</DialogTitle>
               </DialogHeader>
               <div className="space-y-4 py-4">
                  <div className="space-y-2">
                     <label className="text-sm font-medium">List Name</label>
                     <Input 
                       placeholder="e.g. Housing Resources 2024" 
                       value={newListName}
                       onChange={(e) => setNewListName(e.target.value)}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Description</label>
                     <Textarea 
                       placeholder="Brief description of this collection..." 
                       value={newListDesc}
                       onChange={(e) => setNewListDesc(e.target.value)}
                     />
                  </div>
               </div>
               <DialogFooter>
                  <Button onClick={handleCreate} disabled={createMutation.isPending || !newListName.trim()}>
                     {createMutation.isPending ? "Creating..." : "Create List"}
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
               <div key={i} className="h-40 rounded-xl bg-muted/20 animate-pulse" />
            ))
         ) : collections?.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border">
               <ListMusic className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <h3 className="text-lg font-medium">No lists yet</h3>
               <p>Create your first collection to get started.</p>
            </div>
         ) : (
            collections?.map((list) => (
               <Card key={list.id} className="group hover:border-primary/50 transition-colors">
                  <CardHeader>
                     <CardTitle className="flex justify-between items-start">
                        <span className="line-clamp-1">{list.name}</span>
                     </CardTitle>
                     <CardDescription className="line-clamp-2 h-10">
                        {list.description || "No description provided."}
                     </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between items-center border-t border-border pt-4">
                     <div className="text-xs text-muted-foreground">
                        Created {list.createdAt ? format(new Date(list.createdAt), 'MMM d, yyyy') : 'Recently'}
                     </div>
                     <Link href={`/lists/${list.id}`}>
                        <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
                           View <ArrowRight className="ml-2 w-3 h-3" />
                        </Button>
                     </Link>
                  </CardFooter>
               </Card>
            ))
         )}
      </div>
    </div>
  );
}
