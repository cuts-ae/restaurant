"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ChevronRight, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@/lib/api";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  ordersToday?: number;
  revenue?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        const user = localStorage.getItem("user");

        if (user) {
          try {
            const userData = JSON.parse(user);
            setUserEmail(userData.email || "");
          } catch (error) {
            console.error("Failed to parse user data:", error);
          }
        }

        const response = await fetch(
          API_ENDPOINTS.restaurants.myRestaurants,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setRestaurants(data.restaurants || []);
        }
      } catch (error) {
        console.error("Failed to fetch restaurants:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user");
    document.cookie = "auth-token=; path=/; max-age=0";
    router.push("/login");
  };
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading restaurants...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.03),rgba(255,255,255,0))]">
      {/* Subtle dot pattern background */}
      <div className="absolute inset-0 opacity-[0.015] bg-[radial-gradient(circle_at_1px_1px,rgb(0_0_0)_1px,transparent_0)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header with user info and logout */}
      <div className="relative border-b border-border/40 bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-semibold">Restaurant Portal</span>
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

      <div className="relative max-w-7xl mx-auto p-8 lg:p-12 space-y-12">
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                Welcome back
              </h1>
              <p className="text-lg text-muted-foreground">
                Select a restaurant to manage
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {restaurants.map((restaurant, index) => (
            <Card
              key={restaurant.id}
              className="group hover:shadow-xl hover:border-primary/20 transition-all duration-300 cursor-pointer hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() =>
                (window.location.href = `/restaurant/${restaurant.id}`)
              }
            >
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-4xl">
                      🍽️
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-2xl">
                        {restaurant.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {restaurant.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="group-hover:bg-accent"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Orders Today
                    </p>
                    <p className="text-2xl font-bold">
                      {restaurant.ordersToday || 0}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">{restaurant.revenue || "AED 0"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-dashed animate-in fade-in duration-1000">
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  Add Another Restaurant
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Expand your operations by adding another restaurant to the
                  platform
                </p>
              </div>
              <Button variant="outline" className="mt-4">
                Request Access
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
