import { useResources } from "@/hooks/use-resources";
import { Link } from "wouter";
import { 
  CheckCircle2, 
  AlertTriangle, 
  FilePlus, 
  ListPlus, 
  ArrowRight,
  TrendingUp,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: resources, isLoading } = useResources();

  const verifiedCount = resources?.filter(r => r.status === "verified").length || 0;
  const missingInfoCount = resources?.filter(r => r.status === "missing_info").length || 0;
  const favorites = resources?.filter(r => r.isFavorite).slice(0, 5) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-display text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your resource database.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="w-24 h-24 text-green-500" />
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-semibold text-muted-foreground mb-1">Verified Resources</h3>
            <div className="text-4xl font-bold font-display text-green-600">
              {isLoading ? <Skeleton className="h-10 w-20" /> : verifiedCount}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Ready for distribution</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="w-24 h-24 text-amber-500" />
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-semibold text-muted-foreground mb-1">Needs Review</h3>
            <div className="text-4xl font-bold font-display text-amber-600">
               {isLoading ? <Skeleton className="h-10 w-20" /> : missingInfoCount}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Missing critical info</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary to-primary/80 p-6 rounded-2xl shadow-lg text-primary-foreground relative overflow-hidden">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold opacity-90">Review Progress</h3>
              <div className="mt-4 flex items-end gap-2">
                 <span className="text-4xl font-bold font-display">
                    {resources ? Math.round((verifiedCount / resources.length) * 100) : 0}%
                 </span>
                 <span className="mb-1 opacity-80">complete</span>
              </div>
            </div>
            <Link href="/review">
              <Button variant="secondary" className="w-full mt-4 bg-white/10 hover:bg-white/20 border-0 text-white">
                Continue Reviewing <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
           <h2 className="text-xl font-bold">Quick Actions</h2>
           <div className="grid grid-cols-2 gap-4">
             <Link href="/resources">
                <div className="bg-card hover:bg-muted/50 border border-border p-6 rounded-xl cursor-pointer transition-all hover:scale-[1.02] flex flex-col items-center justify-center text-center gap-3">
                   <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <FilePlus className="w-6 h-6" />
                   </div>
                   <span className="font-semibold">Add Resource</span>
                </div>
             </Link>
             <Link href="/lists">
                <div className="bg-card hover:bg-muted/50 border border-border p-6 rounded-xl cursor-pointer transition-all hover:scale-[1.02] flex flex-col items-center justify-center text-center gap-3">
                   <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                      <ListPlus className="w-6 h-6" />
                   </div>
                   <span className="font-semibold">Create List</span>
                </div>
             </Link>
           </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold flex items-center gap-2">
               <Star className="w-5 h-5 text-amber-400 fill-current" />
               Recent Favorites
             </h2>
             <Link href="/resources?isFavorite=true">
               <span className="text-sm text-primary hover:underline cursor-pointer">View All</span>
             </Link>
          </div>
          
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {isLoading ? (
               <div className="p-4 space-y-3">
                 <Skeleton className="h-12 w-full" />
                 <Skeleton className="h-12 w-full" />
               </div>
            ) : favorites.length === 0 ? (
               <div className="p-8 text-center text-muted-foreground">
                 No favorites yet. Star resources to see them here.
               </div>
            ) : (
               favorites.map(fav => (
                 <div key={fav.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div>
                      <div className="font-semibold">{fav.name}</div>
                      <div className="text-sm text-muted-foreground">{fav.category}</div>
                    </div>
                    <StatusBadge status={fav.status} />
                 </div>
               ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
