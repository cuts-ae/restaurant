"use client";

import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { usePathname, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Utensils,
  Package,
  BarChart,
  LogOut,
  User,
  MessageSquare,
  Clock,
} from "@/components/icons";
import { API_ENDPOINTS } from "@/lib/api";
import { RestaurantStatusToggle } from "@/components/restaurant-status-toggle";

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const restaurantSlug = decodeURIComponent(params.slug as string);
  // Remove @ from slug for localStorage key
  const cleanSlug = useMemo(
    () =>
      restaurantSlug.startsWith("@")
        ? restaurantSlug.slice(1)
        : restaurantSlug,
    [restaurantSlug]
  );
  const [userEmail, setUserEmail] = useState<string>("");
  const [restaurantName, setRestaurantName] = useState<string>("Loading...");
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [operatingStatus, setOperatingStatus] = useState<"open" | "not_accepting_orders" | "closed">("open");

  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (!token) {
      router.push("/login");
      return;
    }

    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        setUserEmail(userData.email || "");
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }

    // Get restaurant from localStorage first (use cleanSlug without @)
    const restaurantData = localStorage.getItem(`restaurant-${cleanSlug}`);
    if (restaurantData) {
      try {
        const restaurant = JSON.parse(restaurantData);
        setRestaurantName(restaurant.name || "Restaurant");
        setRestaurantId(restaurant.id || "");
        setOperatingStatus(restaurant.operating_status || "open");
        return;
      } catch (error) {
        console.error("Failed to parse restaurant data:", error);
      }
    }

    // Fallback: Fetch from API if not in localStorage
    const fetchRestaurant = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        const response = await fetch(API_ENDPOINTS.restaurants.myRestaurants, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const restaurant = data.restaurants?.find((r: { slug: string }) => r.slug === cleanSlug);
          if (restaurant) {
            setRestaurantName(restaurant.name || "Restaurant");
            setRestaurantId(restaurant.id || "");
            setOperatingStatus(restaurant.operating_status || "open");
            localStorage.setItem(`restaurant-${cleanSlug}`, JSON.stringify(restaurant));
          }
        }
      } catch (error) {
        console.error("Failed to fetch restaurant:", error);
        setRestaurantName("Restaurant");
      }
    };

    fetchRestaurant();
  }, [cleanSlug, router]);

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
      href: `/restaurant/${restaurantSlug}/orders`,
    },
    {
      value: "history",
      label: "History",
      icon: Clock,
      href: `/restaurant/${restaurantSlug}/history`,
    },
    {
      value: "menu",
      label: "Menu",
      icon: Utensils,
      href: `/restaurant/${restaurantSlug}/menu`,
    },
    {
      value: "analytics",
      label: "Analytics",
      icon: BarChart,
      href: `/restaurant/${restaurantSlug}/analytics`,
    },
    {
      value: "support",
      label: "Support",
      icon: MessageSquare,
      href: `/restaurant/${restaurantSlug}/support`,
    },
  ];

  const activeTab = pathname?.includes("/history")
    ? "history"
    : pathname?.includes("/orders")
    ? "orders"
    : pathname?.includes("/menu")
      ? "menu"
      : pathname?.includes("/analytics")
        ? "analytics"
        : pathname?.includes("/support")
          ? "support"
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
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/40">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">9am - 8pm</span>
              </div>
              {restaurantId && (
                <RestaurantStatusToggle
                  restaurantId={restaurantId}
                  initialStatus={operatingStatus}
                  onStatusChange={(newStatus) => {
                    setOperatingStatus(newStatus);
                    // Update localStorage
                    const restaurantData = localStorage.getItem(`restaurant-${cleanSlug}`);
                    if (restaurantData) {
                      try {
                        const restaurant = JSON.parse(restaurantData);
                        restaurant.operating_status = newStatus;
                        localStorage.setItem(`restaurant-${cleanSlug}`, JSON.stringify(restaurant));
                      } catch (error) {
                        console.error("Failed to update localStorage:", error);
                      }
                    }
                  }}
                />
              )}
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">{userEmail}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} className="w-full">
            <TabsList className="grid w-full max-w-3xl grid-cols-5 h-12 bg-muted/50">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link key={tab.value} href={tab.href}>
                    <TabsTrigger
                      value={tab.value}
                      className="w-full gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </TabsTrigger>
                  </Link>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="relative max-w-[1400px] mx-auto p-8">{children}</div>
    </div>
  );
}
