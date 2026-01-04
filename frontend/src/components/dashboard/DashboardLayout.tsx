import * as React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "../ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Separator } from "../ui/separator";
import { Search } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "../../context/AuthContext";
import { CommandDialog } from "../ui/command";
import { CommandMenu } from "./CommandMenu";
import { NotificationCenter } from "./NotificationCenter";
import { UserMenu } from "./UserMenu";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const [commandOpen, setCommandOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="relative h-9 w-64 justify-start text-sm text-muted-foreground sm:pr-12"
                onClick={() => setCommandOpen(true)}
              >
                <Search className="mr-2 h-4 w-4" />
                <span>Search...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter />
              {user && (
                <UserMenu
                  user={{
                    name: user.email.split("@")[0],
                    email: user.email,
                    avatar: "",
                  }}
                />
              )}
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 overflow-auto">
          {children}
        </main>
      </SidebarInset>
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandMenu />
      </CommandDialog>
    </SidebarProvider>
  );
}
