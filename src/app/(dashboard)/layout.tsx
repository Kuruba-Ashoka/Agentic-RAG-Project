"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Building2, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/server/actions/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isChat = pathname === "/chat";
  const [userEmail, setUserEmail] = useState<string>("");
  const [userInitials, setUserInitials] = useState<string>("U");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const user = data?.user;
        if (user?.email) {
          setUserEmail(user.email);
          const displayName = user.name || user.email.split("@")[0];
          setUserInitials(displayName.slice(0, 2).toUpperCase());
        }
      })
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    const res = await signOutAction();
    if (res.success) {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 h-full w-full bg-background border-l border-border/50">
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 sm:gap-3 border-b border-border/50 bg-background/80 backdrop-blur-xl px-3 sm:px-6 sticky top-0 z-10 shadow-xs anim-slide-down">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <SidebarTrigger className="-ml-1 sm:-ml-2 hover:bg-muted transition-colors rounded-xl p-2 shrink-0" />
              
              <div className="flex items-center gap-2 min-w-0">
                <img src="/images/college-logo.png" alt="ALITS" className="h-7 w-auto object-contain shrink-0" />
                <span className="font-bold text-sm text-foreground truncate">ALITS NexusIQ</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">

              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-foreground h-8 px-2.5 rounded-lg border border-border/50 hover:bg-muted"
                title="Return to Campus Gateway"
              >
                <Building2 className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                <span>Campus Home</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-8 px-2.5 rounded-lg border border-rose-200/60 transition-colors flex items-center gap-1.5"
                title="Sign out of Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-medium">Sign Out</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  suppressHydrationWarning
                  className={cn(buttonVariants({ variant: "ghost" }), "relative h-9 w-9 rounded-full p-0 border-0 shrink-0")}
                >
                  <Avatar className="h-9 w-9 border border-border/50 shadow-soft hover:shadow-md transition-shadow">
                    <AvatarFallback className="bg-primary/10 text-primary">{userInitials}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userEmail || "Student User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push('/student/profile')}>
                    Student Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/placement')}>
                    Career Hub
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/10">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
          {isChat ? (
            <main className="flex-1 overflow-hidden relative w-full h-[calc(100vh-3.5rem)]">
              {children}
            </main>
          ) : (
            <main className="flex-1 overflow-auto p-3 sm:p-5 lg:p-6 relative w-full">
              <div className="w-full space-y-6 max-w-none animate-page-fade-up entrance-stagger">
                {children}
              </div>
            </main>
          )}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
