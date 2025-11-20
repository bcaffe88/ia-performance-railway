import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import AuthCallback from "./pages/AuthCallback";
import Organizations from "./pages/Organizations";
import Appointments from "./pages/Appointments";
import AuthCallback from "./pages/AuthCallback";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/organizations"} component={Organizations} />
      <Route path={"/appointments"} component={Appointments} />
      <Route path={"/auth/callback"} component={AuthCallback} />
      <Route path={"/auth/callback"} component={AuthCallback} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
