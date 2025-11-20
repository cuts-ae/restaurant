"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Clock,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  CheckCircle,
  Star,
  Calendar,
  BarChart as BarChartIcon,
  Target
} from "@/components/icons";
import { API_ENDPOINTS } from "@/lib/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TopItem {
  menu_item_id: string;
  name: string;
  count: number;
}

interface RevenueByDay {
  date: string;
  orders: number;
  revenue: number;
}

interface OrdersByStatus {
  status: string;
  count: number;
}

interface PeakHour {
  hour: number;
  orders: number;
}

interface Analytics {
  today: {
    orders: number;
    revenue: number;
  };
  topItems: TopItem[];
  revenueByDay: RevenueByDay[];
  ordersByStatus: OrdersByStatus[];
  peakHours: PeakHour[];
}

export default function AnalyticsPage() {
  const params = useParams();
  const restaurantSlug = decodeURIComponent(params.slug as string);
  // Remove @ from slug for localStorage key
  const cleanSlug = useMemo(
    () =>
      restaurantSlug.startsWith("@")
        ? restaurantSlug.slice(1)
        : restaurantSlug,
    [restaurantSlug]
  );

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string>("");

  useEffect(() => {
    async function loadRestaurantId() {
      // Get restaurant ID from localStorage first
      const restaurantData = localStorage.getItem(`restaurant-${cleanSlug}`);
      if (restaurantData) {
        try {
          const restaurant = JSON.parse(restaurantData);
          if (restaurant?.id) {
            console.log("Setting restaurant ID from localStorage:", restaurant.id);
            setRestaurantId(restaurant.id);
            return;
          }
        } catch (error) {
          console.error("Failed to parse restaurant data:", error);
        }
      }

      // Fallback: Fetch from API
      try {
        const token = localStorage.getItem("auth-token");
        console.log("Fetching restaurant ID from API...");
        const response = await fetch(API_ENDPOINTS.restaurants.myRestaurants, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const restaurant = data.restaurants?.find(
            (r: { slug: string; id: string }) => r.slug === cleanSlug,
          );
          if (restaurant) {
            console.log("Setting restaurant ID from API:", restaurant.id);
            setRestaurantId(restaurant.id);
            localStorage.setItem(
              `restaurant-${cleanSlug}`,
              JSON.stringify(restaurant),
            );
          } else {
            console.error("Restaurant not found in myRestaurants");
            setIsLoading(false);
          }
        } else {
          console.error("Failed to fetch myRestaurants:", response.status);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch restaurant:", error);
        setIsLoading(false);
      }
    }

    loadRestaurantId();
  }, [cleanSlug]);

  useEffect(() => {
    if (!restaurantId) {
      console.log("No restaurant ID yet, waiting...");
      return;
    }
    console.log("Restaurant ID is set, fetching analytics for:", restaurantId);
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const fetchAnalytics = async () => {
    if (!restaurantId) return;

    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        API_ENDPOINTS.restaurants.analytics(restaurantId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Analytics fetched successfully:", data.analytics);
        setAnalytics(data.analytics);
      } else {
        console.error("Failed to fetch analytics:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate additional metrics from available data
  const calculatedMetrics = useMemo(() => {
    if (!analytics) return null;

    // Average Order Value Today
    const avgOrderValueToday = analytics.today.orders > 0
      ? analytics.today.revenue / analytics.today.orders
      : 0;

    // Weekly totals
    const weeklyRevenue = analytics.revenueByDay.reduce((sum, day) => sum + day.revenue, 0);
    const weeklyOrders = analytics.revenueByDay.reduce((sum, day) => sum + day.orders, 0);

    // Average Order Value Weekly
    const avgOrderValueWeek = weeklyOrders > 0 ? weeklyRevenue / weeklyOrders : 0;

    // Peak hour today
    const peakHourToday = analytics.peakHours.length > 0
      ? analytics.peakHours.reduce((prev, current) =>
          prev.orders > current.orders ? prev : current
        )
      : null;

    // Most popular category (from top items - simplified)
    const mostPopularItem = analytics.topItems.length > 0 ? analytics.topItems[0].name : "N/A";

    // Order fulfillment rate (delivered orders / total orders)
    const totalOrders = analytics.ordersByStatus.reduce((sum, status) => sum + status.count, 0);
    const deliveredOrders = analytics.ordersByStatus.find(s => s.status === 'delivered')?.count || 0;
    const fulfillmentRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

    // Growth comparison (compare last day vs previous days average)
    const lastDay = analytics.revenueByDay[analytics.revenueByDay.length - 1];
    const previousDays = analytics.revenueByDay.slice(0, -1);
    const previousAvgRevenue = previousDays.length > 0
      ? previousDays.reduce((sum, day) => sum + day.revenue, 0) / previousDays.length
      : 0;
    const revenueGrowth = previousAvgRevenue > 0
      ? ((lastDay?.revenue || 0) - previousAvgRevenue) / previousAvgRevenue * 100
      : 0;

    // Total unique customers (estimated from total orders)
    const estimatedCustomers = Math.ceil(weeklyOrders * 0.7);

    return {
      avgOrderValueToday,
      avgOrderValueWeek,
      weeklyRevenue,
      weeklyOrders,
      peakHourToday,
      mostPopularItem,
      fulfillmentRate,
      revenueGrowth,
      estimatedCustomers
    };
  }, [analytics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Revenue Today",
      value: `AED ${analytics.today.revenue.toFixed(2)}`,
      icon: ShoppingCart,
      color: "bg-gray-800",
      trend: calculatedMetrics?.revenueGrowth
        ? `${calculatedMetrics.revenueGrowth > 0 ? '+' : ''}${calculatedMetrics.revenueGrowth.toFixed(1)}%`
        : null
    },
    {
      title: "Orders Today",
      value: analytics.today.orders.toString(),
      icon: Package,
      color: "bg-gray-800",
    },
    {
      title: "Avg Order Value Today",
      value: `AED ${calculatedMetrics?.avgOrderValueToday.toFixed(2) || "0.00"}`,
      icon: Target,
      color: "bg-gray-800",
    },
    {
      title: "Revenue This Week",
      value: `AED ${calculatedMetrics?.weeklyRevenue.toFixed(2) || "0.00"}`,
      icon: Calendar,
      color: "bg-gray-800",
    },
    {
      title: "Orders This Week",
      value: calculatedMetrics?.weeklyOrders.toString() || "0",
      icon: BarChartIcon,
      color: "bg-gray-800",
    },
    {
      title: "Avg Order Value (Week)",
      value: `AED ${calculatedMetrics?.avgOrderValueWeek.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      color: "bg-gray-800",
    },
    {
      title: "Peak Hour Today",
      value: calculatedMetrics?.peakHourToday
        ? `${calculatedMetrics.peakHourToday.hour}:00`
        : "No data",
      icon: Clock,
      color: "bg-gray-800",
      subtitle: calculatedMetrics?.peakHourToday
        ? `${calculatedMetrics.peakHourToday.orders} orders`
        : ""
    },
    {
      title: "Est. Customers (Week)",
      value: calculatedMetrics?.estimatedCustomers.toString() || "0",
      icon: Users,
      color: "bg-gray-800",
    },
    {
      title: "Fulfillment Rate",
      value: `${calculatedMetrics?.fulfillmentRate.toFixed(1) || "0.0"}%`,
      icon: CheckCircle,
      color: "bg-gray-800",
    },
    {
      title: "Top Selling Item",
      value: calculatedMetrics?.mostPopularItem || "N/A",
      icon: Star,
      color: "bg-gray-800",
      subtitle: analytics.topItems[0]?.count ? `${analytics.topItems[0].count} orders` : ""
    },
  ];

  // Format revenue data for charts
  const revenueChartData = analytics.revenueByDay.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    revenue: item.revenue,
    orders: item.orders,
  }));

  // Format peak hours data
  const peakHoursData = analytics.peakHours.map((item) => ({
    hour: `${item.hour}:00`,
    orders: item.orders,
  }));

  // Status colors for pie chart - grayscale
  const STATUS_COLORS = {
    pending: "#1f2937",
    confirmed: "#374151",
    preparing: "#4b5563",
    ready: "#6b7280",
    picked_up: "#9ca3af",
    in_transit: "#d1d5db",
    delivered: "#e5e7eb",
  };

  const statusChartData = analytics.ordersByStatus.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1).replace("_", " "),
    value: item.count,
    color: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || "#6b7280",
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          Comprehensive insights into your restaurant performance
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.title}
              className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center shadow-sm`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  {stat.trend && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      parseFloat(stat.trend) > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {stat.trend}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                  <p className="text-xl font-bold tracking-tight truncate" title={stat.value}>
                    {stat.value}
                  </p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* All Charts in 2x2 Grid - Same Height */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Selling Items */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-[340px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5" />
              Top Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 flex-1 overflow-auto">
            {analytics.topItems && analytics.topItems.length > 0 ? (
              analytics.topItems.slice(0, 4).map((item, index) => (
                <div
                  key={item.menu_item_id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.count} orders
                      </p>
                    </div>
                  </div>
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600"
                      style={{
                        width: `${Math.min((item.count / (analytics.topItems[0]?.count || 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  No order data available
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Revenue Trend Chart */}
        <Card className="animate-in fade-in duration-700 h-[340px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="0" stroke="#f3f4f6" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 'auto']}
                    width={35}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(16, 185, 129, 0.95)",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: "#fff",
                      padding: "8px 12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={4}
                    name="Revenue (AED)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm">No revenue data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders by Day Chart */}
        <Card className="animate-in fade-in duration-800 h-[340px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5" />
              Daily Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="0" stroke="#f3f4f6" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(37, 99, 235, 0.95)",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: "#fff",
                      padding: "8px 12px",
                    }}
                    cursor={{ fill: "rgba(37, 99, 235, 0.1)" }}
                  />
                  <Bar
                    dataKey="orders"
                    fill="#2563eb"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm">No order data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card className="animate-in fade-in duration-900 h-[340px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5" />
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenueChartData.map(d => ({
                    date: d.date,
                    avg: d.orders > 0 ? (d.revenue / d.orders).toFixed(2) : 0
                  }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="0" stroke="#f3f4f6" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(37, 99, 235, 0.95)",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: "#fff",
                      padding: "8px 12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    stroke="#2563eb"
                    strokeWidth={4}
                    name="Avg Value (AED)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm">No data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
