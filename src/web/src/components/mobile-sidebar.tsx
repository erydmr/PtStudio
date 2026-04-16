"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Users, Dumbbell, UserCheck, Package, ShoppingCart, LayoutDashboard, Settings, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["Admin", "Trainer", "Client"] },
  { title: "Takvim", href: "/calendar", icon: CalendarDays, roles: ["Admin", "Trainer", "Client"] },
  { title: "Kullanicilar", href: "/users", icon: Users, roles: ["Admin"] },
  { title: "Antrenorler", href: "/trainers", icon: Dumbbell, roles: ["Admin"] },
  { title: "Musteriler", href: "/clients", icon: UserCheck, roles: ["Admin", "Trainer"] },
  { title: "Paketler", href: "/packages", icon: Package, roles: ["Admin"] },
  { title: "Paket Satisi", href: "/client-packages", icon: ShoppingCart, roles: ["Admin"] },
  { title: "Musterilerim", href: "/my-clients", icon: UserCheck, roles: ["Trainer"] },
  { title: "Paketlerim", href: "/my-packages", icon: Package, roles: ["Client"] },
  { title: "Ayarlar", href: "/settings", icon: Settings, roles: ["Admin"] },
];

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r">
        <div className="flex items-center justify-between px-4 pt-5 mb-6">
          <h1 className="text-xl font-bold text-sidebar-foreground">PT Studio</h1>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="px-2 space-y-1">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
