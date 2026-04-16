"use client";

import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <div className="text-sm text-right">
          <p className="font-medium">{user?.fullName}</p>
          <p className="text-muted-foreground text-xs">{user?.role}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} title="Cikis Yap">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
