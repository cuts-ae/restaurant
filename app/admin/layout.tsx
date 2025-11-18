"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Users,
  FileText,
  LogOut,
  User,
  Utensils,
  MessageSquare,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    const user = localStorage.getItem("user");

    if (!token) {
      router.push("/login");
      return;
    }

    if (user) {
      try {
        const userData = JSON.parse(user);
        setUserEmail(userData.email || "");

        // Check if user is admin using role-based access control
        if (userData.role !== "admin") {
          router.push("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Failed to parse user data:", error);
        router.push("/login");
        return;
      }
    }

    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user");
    document.cookie = "auth-token=; path=/; max-age=0";
    router.push("/login");
  };

  const navItems = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/admin/orders",
      label: "Orders",
      icon: ShoppingBag,
    },
    {
      href: "/admin/restaurants",
      label: "Restaurants",
      icon: Store,
    },
    {
      href: "/admin/users",
      label: "Users",
      icon: Users,
    },
    {
      href: "/admin/menu-items",
      label: "Menu Items",
      icon: Utensils,
    },
    {
      href: "/admin/support",
      label: "Support",
      icon: MessageSquare,
    },
    {
      href: "/admin/invoices",
      label: "Invoices",
      icon: FileText,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-xl font-semibold">Administrator Portal</span>
                <p className="text-xs text-muted-foreground">
                  Restaurant Management System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{userEmail}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border/40 min-h-screen p-6">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
