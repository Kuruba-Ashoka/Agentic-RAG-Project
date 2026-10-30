"use client";

import * as React from "react";
import {
  Settings,
  LayoutDashboard,
  BookOpen,
  Bot,
  BookMarked,
  FileText,
  BarChart2,
  FlaskConical,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Student Academic Hub">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Student Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/research"))}>
            <BookMarked className="mr-2 h-4 w-4 text-indigo-500" />
            <span>Research Workspace</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/chat"))}>
            <Bot className="mr-2 h-4 w-4 text-indigo-500" />
            <span>AI Academic Copilot</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/documents"))}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Course Notes & Syllabi</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/knowledge-bases"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Knowledge Bases</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Administration & Tools">
          <CommandItem onSelect={() => runCommand(() => router.push("/analytics"))}>
            <BarChart2 className="mr-2 h-4 w-4" />
            <span>Operational Analytics</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/agents"))}>
            <Bot className="mr-2 h-4 w-4" />
            <span>Autonomous Agents</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/evaluation"))}>
            <FlaskConical className="mr-2 h-4 w-4" />
            <span>RAG Quality Evaluation</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
