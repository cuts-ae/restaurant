"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { usePathname, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChefHat, Package, BarChart3, LogOut, User } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const restaurantSlug = params.slug as string;
  const [userEmail, setUserEmail] = useState<string>("");
  const [restaurantName, setRestaurantName] = useState<string>("Loading...");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        setUserEmail(userData.email || "");
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }

    // Fetch restaurant details
    const fetchRestaurant = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        const response = await fetch(
          API_ENDPOINTS.restaurants.details(`@${restaurantSlug}`),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setRestaurantName(data.restaurant?.name || "Restaurant");
        }
      } catch (error) {
        console.error("Failed to fetch restaurant:", error);
        setRestaurantName("Restaurant");
      }
    };

    fetchRestaurant();
  }, [restaurantSlug]);

  const handleLogout = () => {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user");
    document.cookie = "auth-token=; path=/; max-age=0";
    router.push("/login");
  };

  const tabs = [
    {
      value: "orders",
      label: "Orders",
      icon: Package,
      href: `/restaurant/@${restaurantSlug}/orders`,
    },
    {
      value: "menu",
      label: "Menu",
      icon: ChefHat,
      href: `/restaurant/@${restaurantSlug}/menu`,
    },
    {
      value: "analytics",
      label: "Analytics",
      icon: BarChart3,
      href: `/restaurant/@${restaurantSlug}/analytics`,
    },
  ];

  const activeTab = pathname.includes("/orders")
    ? "orders"
    : pathname.includes("/menu")
      ? "menu"
      : pathname.includes("/analytics")
        ? "analytics"
        : "orders";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.03),rgba(255,255,255,0))]">
      {/* Subtle dot pattern background */}
      <div className="absolute inset-0 opacity-[0.015] bg-[radial-gradient(circle_at_1px_1px,rgb(0_0_0)_1px,transparent_0)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative border-b border-border/40 bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-12 h-12 object-contain"
              />
              <div className="space-y-1">
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  ← Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                  {restaurantName}
                </h1>
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

          <Tabs value={activeTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 h-12 bg-muted/50">
              {tabs.map((tab) => (
                <Link key={tab.value} href={tab.href}>
                  <TabsTrigger
                    value={tab.value}
                    className="w-full gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                </Link>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="relative max-w-[1400px] mx-auto p-8">{children}</div>
    </div>
  );
}
