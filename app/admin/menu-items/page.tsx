"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Utensils,
  DollarSign,
  CheckCircle,
  XCircle,
  Star,
  TrendingUp,
  Package,
  Download,
} from "@/components/icons";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  restaurant: {
    name: string;
    id: string;
  };
  category: string;
  price: number;
  available: boolean;
  ordersCount: number;
  revenue: number;
  rating: number;
  reviewsCount: number;
  lastUpdated: string;
}

export default function AdminMenuItemsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");

  const menuItems: MenuItem[] = [
    {
      id: "1",
      name: "Wagyu Ribeye Steak",
      description: "Premium Japanese Wagyu beef with marble score A5",
      restaurant: { name: "The Butcher Shop", id: "r1" },
      category: "Steak",
      price: 180,
      available: true,
      ordersCount: 234,
      revenue: 42120,
      rating: 4.9,
      reviewsCount: 187,
      lastUpdated: "2024-11-17",
    },
    {
      id: "2",
      name: "Mixed Grill Platter",
      description: "Assorted meats including lamb, chicken, and beef",
      restaurant: { name: "Grill House", id: "r3" },
      category: "Platter",
      price: 150,
      available: true,
      ordersCount: 198,
      revenue: 29700,
      rating: 4.7,
      reviewsCount: 156,
      lastUpdated: "2024-11-17",
    },
    {
      id: "3",
      name: "Beef Tenderloin",
      description: "Tender beef cut, grilled to perfection",
      restaurant: { name: "Prime Cuts", id: "r2" },
      category: "Steak",
      price: 220,
      available: true,
      ordersCount: 176,
      revenue: 38720,
      rating: 4.8,
      reviewsCount: 143,
      lastUpdated: "2024-11-17",
    },
    {
      id: "4",
      name: "Lamb Chops",
      description: "Premium New Zealand lamb chops",
      restaurant: { name: "The Butcher Shop", id: "r1" },
      category: "Lamb",
      price: 90,
      available: true,
      ordersCount: 165,
      revenue: 14850,
      rating: 4.6,
      reviewsCount: 134,
      lastUpdated: "2024-11-17",
    },
    {
      id: "5",
      name: "T-Bone Steak",
      description: "Classic T-bone with both strip and tenderloin",
      restaurant: { name: "Prime Cuts", id: "r2" },
      category: "Steak",
      price: 160,
      available: true,
      ordersCount: 143,
      revenue: 22880,
      rating: 4.7,
      reviewsCount: 119,
      lastUpdated: "2024-11-17",
    },
    {
      id: "6",
      name: "BBQ Chicken Wings",
      description: "Smoky BBQ chicken wings",
      restaurant: { name: "The Butcher Shop", id: "r1" },
      category: "Chicken",
      price: 80,
      available: true,
      ordersCount: 132,
      revenue: 10560,
      rating: 4.5,
      reviewsCount: 98,
      lastUpdated: "2024-11-16",
    },
    {
      id: "7",
      name: "Grilled Salmon",
      description: "Fresh Atlantic salmon grilled with herbs",
      restaurant: { name: "Prime Cuts", id: "r2" },
      category: "Seafood",
      price: 195,
      available: false,
      ordersCount: 87,
      revenue: 16965,
      rating: 4.8,
      reviewsCount: 72,
      lastUpdated: "2024-11-15",
    },
    {
      id: "8",
      name: "Lamb Biryani",
      description: "Aromatic basmati rice with tender lamb",
      restaurant: { name: "Grill House", id: "r3" },
      category: "Rice",
      price: 120,
      available: true,
      ordersCount: 156,
      revenue: 18720,
      rating: 4.9,
      reviewsCount: 142,
      lastUpdated: "2024-11-17",
    },
    {
      id: "9",
      name: "Caesar Salad",
      description: "Classic Caesar with grilled chicken",
      restaurant: { name: "Grill House", id: "r3" },
      category: "Salad",
      price: 40,
      available: true,
      ordersCount: 98,
      revenue: 3920,
      rating: 4.3,
      reviewsCount: 76,
      lastUpdated: "2024-11-17",
    },
    {
      id: "10",
      name: "Chicken Breast",
      description: "Grilled chicken breast with herbs",
      restaurant: { name: "The Butcher Shop", id: "r1" },
      category: "Chicken",
      price: 60,
      available: true,
      ordersCount: 145,
      revenue: 8700,
      rating: 4.4,
      reviewsCount: 112,
      lastUpdated: "2024-11-17",
    },
    {
      id: "11",
      name: "Beef Burger",
      description: "Angus beef burger with premium toppings",
      restaurant: { name: "Prime Cuts", id: "r2" },
      category: "Burger",
      price: 75,
      available: true,
      ordersCount: 189,
      revenue: 14175,
      rating: 4.6,
      reviewsCount: 165,
      lastUpdated: "2024-11-17",
    },
    {
      id: "12",
      name: "Grilled Vegetables",
      description: "Seasonal vegetables grilled to perfection",
      restaurant: { name: "Prime Cuts", id: "r2" },
      category: "Sides",
      price: 50,
      available: true,
      ordersCount: 203,
      revenue: 10150,
      rating: 4.5,
      reviewsCount: 134,
      lastUpdated: "2024-11-17",
    },
  ];

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;

    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && item.available) ||
      (availabilityFilter === "unavailable" && !item.available);

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const categories = [
    "all",
    ...Array.from(new Set(menuItems.map((item) => item.category))),
  ];

  const stats = {
    totalItems: menuItems.length,
    available: menuItems.filter((i) => i.available).length,
    unavailable: menuItems.filter((i) => !i.available).length,
    totalRevenue: menuItems.reduce((sum, item) => sum + item.revenue, 0),
    totalOrders: menuItems.reduce((sum, item) => sum + item.ordersCount, 0),
    avgRating: (
      menuItems.reduce((sum, item) => sum + item.rating, 0) / menuItems.length
    ).toFixed(1),
  };

  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      items: filteredItems,
      stats: stats,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `menu-items-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Items</h1>
          <p className="text-muted-foreground mt-2">
            All menu items across all restaurants
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportData} className="gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all restaurants
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.available}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ready to order</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              AED {(stats.totalRevenue / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalOrders} total orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              <div className="text-3xl font-bold">{stats.avgRating}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Overall average</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, description, restaurant, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium">Category:</span>
            {categories.map((category) => (
              <Button
                key={category}
                variant={categoryFilter === category ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(category)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 items-center border-l pl-4">
            <span className="text-sm font-medium">Status:</span>
            {["all", "available", "unavailable"].map((status) => (
              <Button
                key={status}
                variant={availabilityFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setAvailabilityFilter(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className={
                        item.available
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }
                    >
                      {item.available ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {item.available ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {item.category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {item.restaurant.name}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold">AED {item.price}</p>
                  <p className="text-xs text-muted-foreground">Price</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold">{item.ordersCount}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold">
                    {(item.revenue / 1000).toFixed(1)}K
                  </p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <p className="text-xl font-bold">{item.rating}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.reviewsCount} reviews
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Last updated: {new Date(item.lastUpdated).toLocaleDateString()}</span>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No menu items found matching your criteria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
