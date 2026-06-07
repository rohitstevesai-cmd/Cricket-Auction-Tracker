import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { DataProvider } from "@/context/DataContext";
import { BettingProvider } from "@/context/BettingContext";
import PublicDashboard from "@/pages/PublicDashboard";
import TeamDetail from "@/pages/TeamDetail";
import ManagementDashboard from "@/pages/ManagementDashboard";
import BettingDashboard from "@/pages/BettingDashboard";
import BettingAdmin from "@/pages/BettingAdmin";
import SplashScreen from "@/components/SplashScreen";
import MatchDetail from "@/pages/MatchDetail";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={PublicDashboard} />
      <Route path="/team/:id" component={TeamDetail} />
      <Route path="/admin" component={ManagementDashboard} />
      <Route path="/match/:id" component={MatchDetail} />
      <Route path="/betting" component={BettingDashboard} />
      <Route path="/betting-admin" component={BettingAdmin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <QueryClientProvider client={queryClient}>
        <BettingProvider>
          <DataProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster theme="dark" position="bottom-right" />
            </TooltipProvider>
          </DataProvider>
        </BettingProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;
