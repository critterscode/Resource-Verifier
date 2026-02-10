import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar, MobileNav } from "@/components/Sidebar";

import Home from "@/pages/Home";
import Resources from "@/pages/Resources";
import Review from "@/pages/Review";
import Lists from "@/pages/Lists";
import ListDetails from "@/pages/ListDetails";
import XOClusters from "@/pages/XOClusters";
import SignalFeed from "@/pages/SignalFeed";
import UpdateQueue from "@/pages/UpdateQueue";
import PublicSearch from "@/pages/PublicSearch";
import ProviderPortal from "@/pages/ProviderPortal";
import NotFound from "@/pages/not-found";

function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl h-full">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/resources" component={Resources} />
            <Route path="/review" component={Review} />
            <Route path="/clusters" component={XOClusters} />
            <Route path="/signals" component={SignalFeed} />
            <Route path="/updates" component={UpdateQueue} />
            <Route path="/lists" component={Lists} />
            <Route path="/lists/:id" component={ListDetails} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}

function Router() {
  const [location] = useLocation();

  if (location === "/search" || location.startsWith("/search?")) {
    return <PublicSearch />;
  }

  if (location === "/provider" || location.startsWith("/provider?")) {
    return <ProviderPortal />;
  }

  return <AdminLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
