import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router as WouterRouter, Route, Switch, Redirect } from "wouter";
import ReelCreatorPage from "@/pages/ReelCreatorPage";
import LandingPage from "@/pages/LandingPage";
import PWAInstallBanner from "@/components/PWAInstallBanner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 60,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/" component={LandingPage} />
            <Route path="/reel" component={ReelCreatorPage} />
            <Route><Redirect to="/" /></Route>
          </Switch>
        </WouterRouter>
        <Toaster />
        <PWAInstallBanner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
