import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import { Redirect, Route, Switch } from "wouter";

export function DebtRedirect(){return <Redirect to="/finance?tab=debts" replace/>}
function Router(){return <DashboardLayout><Switch><Route path="/" component={Home}/><Route path="/security" component={Home}/><Route path="/finance" component={Home}/><Route path="/debts" component={DebtRedirect}/><Route path="/education" component={Home}/><Route path="/vehicles" component={Home}/><Route path="/reports" component={Home}/><Route path="/settings" component={Home}/><Route component={NotFound}/></Switch></DashboardLayout>}
export default function App(){return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-center"/><Router/></TooltipProvider></ThemeProvider></ErrorBoundary>}
