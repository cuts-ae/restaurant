"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  ShoppingBag,
  Store,
  Users,
  Clock,
  ChefHat,
  MessageSquare,
  Package,
  Activity,
  CheckCircle,
  XCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
  Star,
  Utensils,
  Banknote,
} from "@/components/icons";

interface DashboardStats {
  overview: {
    totalRevenue: number;
    revenueChange: number;
    totalOrders: number;
    ordersChange: number;
    totalRestaurants: number;
    activeRestaurants: number;
    totalUsers: number;
    usersChange: number;
    totalMenuItems: number;
    availableItems: number;
  };
  orders: {
    pending: number;
    preparing: number;
    ready: number;
    completed: number;
    cancelled: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    allTime: number;
  };
  users: {
    customers: number;
    restaurantOwners: number;
    admins: number;
    activeToday: number;
  };
  restaurants: {
    active: number;
    inactive: number;
    pending: number;
    topPerforming: Array<{
      id: string;
      name: string;
      revenue: number;
      orders: number;
      rating: number;
    }>;
  };
  supportTickets: {
    open: number;
    inProgress: number;
    resolved: number;
    total: number;
  };
  recentActivity: Array<{
    id: string;
    type: "order" | "user" | "restaurant" | "ticket";
    description: string;
    timestamp: string;
  }>;
  topMenuItems: Array<{
    id: string;
    name: string;
    restaurant: string;
    ordersCount: number;
    revenue: number;
  }>;
}

export default function AdminDashboardPage() {
  const [stats] = useState<DashboardStats>({
    overview: {
      totalRevenue: 489650,
      revenueChange: 12.5,
      totalOrders: 2847,
      ordersChange: 8.3,
      totalRestaurants: 12,
      activeRestaurants: 11,
      totalUsers: 8547,
      usersChange: 15.2,
      totalMenuItems: 248,
      availableItems: 231,
    },
    orders: {
      pending: 23,
      preparing: 45,
      ready: 12,
      completed: 2689,
      cancelled: 78,
    },
    revenue: {
      today: 12450,
      thisWeek: 87230,
      thisMonth: 342890,
      allTime: 489650,
    },
    users: {
      customers: 8245,
      restaurantOwners: 12,
      admins: 3,
      activeToday: 324,
    },
    restaurants: {
      active: 11,
      inactive: 1,
      pending: 2,
      topPerforming: [
        {
          id: "1",
          name: "The Butcher Shop",
          revenue: 125430,
          orders: 456,
          rating: 4.8,
        },
        {
          id: "2",
          name: "Prime Cuts",
          revenue: 98750,
          orders: 389,
          rating: 4.6,
        },
        {
          id: "3",
          name: "Grill House",
          revenue: 87650,
          orders: 345,
          rating: 4.9,
        },
      ],
    },
    supportTickets: {
      open: 8,
      inProgress: 15,
      resolved: 234,
      total: 257,
    },
    recentActivity: [
      {
        id: "1",
        type: "order",
        description: "New order ORD-1245 from Ahmed Al Maktoum - AED 450",
        timestamp: "2 min ago",
      },
      {
        id: "2",
        type: "user",
        description: "New customer registration: Sara Malik",
        timestamp: "5 min ago",
      },
      {
        id: "3",
        type: "restaurant",
        description: "The Butcher Shop updated menu items",
        timestamp: "12 min ago",
      },
      {
        id: "4",
        type: "ticket",
        description: "Support ticket #156 resolved",
        timestamp: "15 min ago",
      },
      {
        id: "5",
        type: "order",
        description: "Order ORD-1244 completed - AED 320",
        timestamp: "18 min ago",
      },
    ],
    topMenuItems: [
      {
        id: "1",
        name: "Wagyu Ribeye Steak",
        restaurant: "The Butcher Shop",
        ordersCount: 234,
        revenue: 42120,
      },
      {
        id: "2",
        name: "Mixed Grill Platter",
        restaurant: "Grill House",
        ordersCount: 198,
        revenue: 29700,
      },
      {
        id: "3",
        name: "Beef Tenderloin",
        restaurant: "Prime Cuts",
        ordersCount: 176,
        revenue: 38720,
      },
      {
        id: "4",
        name: "Lamb Chops",
        restaurant: "The Butcher Shop",
        ordersCount: 165,
        revenue: 14850,
      },
      {
        id: "5",
        name: "T-Bone Steak",
        restaurant: "Prime Cuts",
        ordersCount: 143,
        revenue: 22880,
      },
    ],
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      stats: stats,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `admin-dashboard-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="h-4 w-4 text-blue-600" />;
      case "user":
        return <Users className="h-4 w-4 text-green-600" />;
      case "restaurant":
        return <Store className="h-4 w-4 text-purple-600" />;
      case "ticket":
        return <MessageSquare className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const overviewCards = [
    {
      title: "Total Revenue",
      value: `AED ${stats.overview.totalRevenue.toLocaleString()}`,
      change: stats.overview.revenueChange,
      icon: Banknote,
      color: "text-green-600",
      bgColor: "bg-green-50",
      subtitle: `AED ${stats.revenue.thisMonth.toLocaleString()} this month`,
    },
    {
      title: "Total Orders",
      value: stats.overview.totalOrders.toLocaleString(),
      change: stats.overview.ordersChange,
      icon: ShoppingBag,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      subtitle: `${stats.orders.pending + stats.orders.preparing + stats.orders.ready} active`,
    },
    {
      title: "Restaurants",
      value: `${stats.overview.activeRestaurants}/${stats.overview.totalRestaurants}`,
      change: 0,
      icon: Store,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      subtitle: "Active restaurants",
    },
    {
      title: "Total Users",
      value: stats.overview.totalUsers.toLocaleString(),
      change: stats.overview.usersChange,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      subtitle: `${stats.users.activeToday} active today`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive overview of the entire platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportData} className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewCards.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change > 0;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change !== 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {isPositive ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
                    >
                      {Math.abs(stat.change)}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      from last month
                    </span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Orders by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">{stats.orders.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Preparing</p>
                    <p className="text-2xl font-bold">{stats.orders.preparing}</p>
                  </div>
                  <ChefHat className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ready</p>
                    <p className="text-2xl font-bold">{stats.orders.ready}</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{stats.orders.completed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                  <p className="text-xl font-bold">{stats.orders.cancelled}</p>
                </div>
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-xl font-bold">
                  AED {stats.revenue.today.toLocaleString()}
                </p>
              </div>
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-xl font-bold">
                  AED {stats.revenue.thisWeek.toLocaleString()}
                </p>
              </div>
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-xl font-bold">
                  AED {stats.revenue.thisMonth.toLocaleString()}
                </p>
              </div>
              <ArrowUpRight className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
              <div>
                <p className="text-sm text-muted-foreground">All Time</p>
                <p className="text-xl font-bold">
                  AED {stats.revenue.allTime.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Users className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Customers</p>
                    <p className="text-xs text-muted-foreground">
                      Active platform users
                    </p>
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  {stats.users.customers.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-purple-50 border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Store className="h-5 w-5 text-purple-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Restaurant Owners</p>
                    <p className="text-xs text-muted-foreground">
                      Business accounts
                    </p>
                  </div>
                </div>
                <p className="text-2xl font-bold">{stats.users.restaurantOwners}</p>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50 border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <Activity className="h-5 w-5 text-orange-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Active Today</p>
                    <p className="text-xs text-muted-foreground">
                      Current active users
                    </p>
                  </div>
                </div>
                <p className="text-2xl font-bold">{stats.users.activeToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-center">
                  <p className="text-2xl font-bold text-yellow-700">
                    {stats.supportTickets.open}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Open</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-center">
                  <p className="text-2xl font-bold text-blue-700">
                    {stats.supportTickets.inProgress}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">In Progress</p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {stats.supportTickets.resolved}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Resolved</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Total Tickets</p>
                  <p className="text-xl font-bold">{stats.supportTickets.total}</p>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600"
                    style={{
                      width: `${(stats.supportTickets.resolved / stats.supportTickets.total) * 100}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(
                    (stats.supportTickets.resolved / stats.supportTickets.total) *
                      100
                  )}
                  % resolution rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Top Performing Restaurants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.restaurants.topPerforming.map((restaurant, index) => (
              <div
                key={restaurant.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{restaurant.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {restaurant.orders} orders
                      </span>
                      <span className="flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {restaurant.rating}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">
                    AED {(restaurant.revenue / 1000).toFixed(1)}K
                  </p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Top Menu Items Across All Restaurants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.topMenuItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.restaurant}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-semibold">{item.ordersCount}</p>
                    <p className="text-xs text-muted-foreground">Orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      AED {(item.revenue / 1000).toFixed(1)}K
                    </p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Platform Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-muted">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Menu Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">
                {stats.overview.totalMenuItems}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Available</span>
                <span className="font-semibold text-green-600">
                  {stats.overview.availableItems}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Unavailable</span>
                <span className="font-semibold text-red-600">
                  {stats.overview.totalMenuItems - stats.overview.availableItems}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Restaurant Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">
                {stats.overview.totalRestaurants}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active</span>
                <span className="font-semibold text-green-600">
                  {stats.restaurants.active}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-semibold text-yellow-600">
                  {stats.restaurants.pending}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Order Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">
                {Math.round(
                  (stats.orders.completed /
                    (stats.overview.totalOrders - stats.orders.cancelled)) *
                    100
                )}
                %
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600"
                  style={{
                    width: `${Math.round((stats.orders.completed / (stats.overview.totalOrders - stats.orders.cancelled)) * 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.orders.completed} completed / {stats.overview.totalOrders - stats.orders.cancelled} total orders
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
