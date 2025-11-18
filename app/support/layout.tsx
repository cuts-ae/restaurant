"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  FileText,
  LogOut,
  User,
} from "lucide-react";

export default function SupportLayout({
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

        // Check if user is support
        if (userData.role !== "support") {
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
      href: "/support/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/support/tickets",
      label: "Support Tickets",
      icon: MessageSquare,
    },
    {
      href: "/support/customers",
      label: "Customers",
      icon: Users,
    },
    {
      href: "/support/reports",
      label: "Reports",
      icon: FileText,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center support-portal-bg">
        <div className="relative">
          <div className="support-loading-spinner"></div>
          <p className="text-lg text-muted-foreground mt-4 animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen support-portal-bg">
      {/* Animated Background Pattern */}
      <div className="support-dot-pattern"></div>
      <div className="support-gradient-orb support-gradient-orb-1"></div>
      <div className="support-gradient-orb support-gradient-orb-2"></div>
      <div className="support-gradient-orb support-gradient-orb-3"></div>

      {/* Header */}
      <div className="support-header-glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative support-logo-container">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-10 h-10 object-contain relative z-10"
                />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-lg font-semibold tracking-tight text-gray-900">
                    Support Portal
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200">
                    <div className="support-status-dot"></div>
                    <span className="text-xs font-medium text-gray-700">
                      Live
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Customer Support Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="support-user-badge">
                <User className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{userEmail}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2 support-logout-btn text-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto relative">
        {/* Sidebar */}
        <aside className="w-56 min-h-screen px-4 py-6 support-sidebar-glass">
          <nav className="space-y-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`support-nav-item ${
                    isActive ? "support-nav-item-active" : ""
                  }`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isActive && <div className="support-nav-active-indicator"></div>}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer Decoration */}
          <div className="mt-auto pt-6">
            <div className="support-sidebar-decoration">
              <div className="text-xs text-gray-500 font-medium">
                Support Portal
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                v2.0
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 relative z-10 support-content-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
