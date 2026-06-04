import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { DataProvider } from "@/context/DataContext";
import PublicDashboard from "@/pages/PublicDashboard";
import TeamDetail from "@/pages/TeamDetail";
import ManagementDashboard from "@/pages/ManagementDashboard";
import SplashScreen from "@/components/SplashScreen";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={PublicDashboard} />
      <Route path="/team/:id" component={TeamDetail} />
      <Route path="/admin" component={ManagementDashboard} />
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
        <DataProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster theme="dark" position="bottom-right" />
          </TooltipProvider>
        </DataProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;
