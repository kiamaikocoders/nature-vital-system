import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search, User, LogOut, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MainLayoutProps {
  children: ReactNode;
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  branch_admin: "Branch Admin",
  doctor: "Doctor",
  pharmacist: "Pharmacist",
};

export function MainLayout({ children }: MainLayoutProps) {
  const { profile, roles, signOut } = useAuth();

  const { data: branch } = useQuery({
    queryKey: ["user-branch", profile?.branch_id],
    queryFn: async () => {
      if (!profile?.branch_id) return null;
      const { data } = await supabase
        .from("branches")
        .select("name, location")
        .eq("id", profile.branch_id)
        .single();
      return data;
    },
    enabled: !!profile?.branch_id,
  });

  const primaryRole = roles[0];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients, records..."
                className="pl-10 bg-background border-input"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
            
            <div className="h-8 w-px bg-border" />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 h-auto py-2 px-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {profile?.full_name || "Loading..."}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {primaryRole ? roleLabels[primaryRole] : "No role"}
                    </p>
                  </div>
                  <div className="rounded-full bg-primary/10 p-2">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm font-medium">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    <div className="flex flex-wrap gap-1">
                      {roles.map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {roleLabels[role]}
                        </Badge>
                      ))}
                    </div>
                    {branch && (
                      <div className="pt-1 border-t border-border mt-1">
                        <p className="text-xs text-muted-foreground">Branch</p>
                        <p className="text-sm font-medium">{branch.name}</p>
                        <p className="text-xs text-muted-foreground">{branch.location}</p>
                      </div>
                    )}
                    {!branch && primaryRole === "super_admin" && (
                      <div className="pt-1 border-t border-border mt-1">
                        <p className="text-xs text-muted-foreground">Access</p>
                        <p className="text-sm font-medium">All Branches</p>
                      </div>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
