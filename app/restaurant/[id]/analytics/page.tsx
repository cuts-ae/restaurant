"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Package,
  TrendingUp,
} from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";

interface TopItem {
  menu_item_id: string;
  name: string;
  count: number;
}

interface Analytics {
  today: {
    orders: number;
    revenue: number;
  };
  topItems: TopItem[];
}

export default function AnalyticsPage() {
  const params = useParams();
  const restaurantId = params.id as string;

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [restaurantId]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        API_ENDPOINTS.restaurants.analytics(restaurantId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Revenue Today",
      value: `AED ${analytics?.today.revenue.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      color: "from-green-500/10 to-green-500/5",
    },
    {
      title: "Orders Today",
      value: analytics?.today.orders.toString() || "0",
      icon: Package,
      color: "from-blue-500/10 to-blue-500/5",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Track your restaurant performance and insights
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.title}
              className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Selling Items (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics?.topItems && analytics.topItems.length > 0 ? (
            analytics.topItems.map((item, index) => (
              <div
                key={item.menu_item_id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200 animate-in fade-in slide-in-from-right-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-lg">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.count} orders
                    </p>
                  </div>
                </div>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/50 transition-all duration-500"
                    style={{
                      width: `${Math.min((item.count / (analytics.topItems[0]?.count || 1)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No order data available for the last 7 days
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="animate-in fade-in duration-1000">
        <CardHeader>
          <CardTitle>Quick Stats Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Today's Performance</p>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Orders:</span>
                  <span className="font-bold">{analytics?.today.orders || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Revenue:</span>
                  <span className="font-bold">AED {analytics?.today.revenue.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg. Order Value:</span>
                  <span className="font-bold">
                    AED {analytics?.today.orders
                      ? (analytics.today.revenue / analytics.today.orders).toFixed(2)
                      : "0.00"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Top Performers</p>
              <div className="space-y-1">
                {analytics?.topItems && analytics.topItems.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Most Popular:</span>
                      <span className="font-bold text-sm">{analytics.topItems[0]?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Orders:</span>
                      <span className="font-bold">{analytics.topItems[0]?.count}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No data available</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
