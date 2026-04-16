"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Dumbbell,
  UserCheck,
  Package,
  ShoppingCart,
  LayoutDashboard,
  Settings,
  CalendarDays,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: ["Admin", "Trainer"],
  },
  {
    title: "Takvim",
    href: "/calendar",
    icon: CalendarDays,
    roles: ["Admin", "Trainer", "Client"],
  },
  {
    title: "Kullanicilar",
    href: "/users",
    icon: Users,
    roles: ["Admin"],
  },
  {
    title: "Antrenorler",
    href: "/trainers",
    icon: Dumbbell,
    roles: ["Admin"],
  },
  {
    title: "Musteriler",
    href: "/clients",
    icon: UserCheck,
    roles: ["Admin", "Trainer"],
  },
  {
    title: "Paketler",
    href: "/packages",
    icon: Package,
    roles: ["Admin"],
  },
  {
    title: "Paket Satisi",
    href: "/client-packages",
    icon: ShoppingCart,
    roles: ["Admin"],
  },
  {
    title: "Musterilerim",
    href: "/my-clients",
    icon: UserCheck,
    roles: ["Trainer"],
  },
  {
    title: "Paketlerim",
    href: "/my-packages",
    icon: Package,
    roles: ["Client"],
  },
  {
    title: "Derslerim",
    href: "/my-lessons",
    icon: BookOpen,
    roles: ["Client"],
  },
  {
    title: "Raporlar",
    href: "/reports",
    icon: BarChart3,
    roles: ["Admin"],
  },
  {
    title: "Ayarlar",
    href: "/settings",
    icon: Settings,
    roles: ["Admin"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow border-r bg-sidebar pt-5 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-6">
          <h1 className="text-xl font-bold text-sidebar-foreground">
            PT Studio
          </h1>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
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
    </aside>
  );
}
