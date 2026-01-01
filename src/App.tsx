import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import UIEditor from "@/pages/pro/UIEditor";
import { LanguageProvider } from "@/hooks/use-language";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProAccessProvider } from "@/hooks/use-pro-access";
import { SmoothScroll } from "@/components/SmoothScroll";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/pro" component={UIEditor} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="zemenpix-theme">
        <ProAccessProvider>
          <LanguageProvider>
            <TooltipProvider>
              <SmoothScroll>
                <Toaster />
                <Router />
              </SmoothScroll>
            </TooltipProvider>
          </LanguageProvider>
        </ProAccessProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
