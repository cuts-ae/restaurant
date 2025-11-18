"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { cn } from "@/lib/utils";
import { API_ENDPOINTS } from "@/lib/api";

interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  base_price: number;
  item_total: number;
  special_instructions?: string;
  menu_items: {
    name: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  delivery_address: {
    street: string;
    city: string;
  };
  order_items: OrderItem[];
  users?: {
    first_name: string;
    last_name: string;
  };
}

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    icon: AccessTimeIcon,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: LocalShippingIcon,
  },
  preparing: {
    label: "Preparing",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: LocalShippingIcon,
  },
  ready: {
    label: "Ready",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: CheckCircleIcon,
  },
  picked_up: {
    label: "Picked Up",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: CheckCircleIcon,
  },
  in_transit: {
    label: "In Transit",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: LocalShippingIcon,
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: CheckCircleIcon,
  },
};

export default function OrdersPage() {
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

  const [filter, setFilter] = useState<string>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
  const [restaurantId, setRestaurantId] = useState<string>("");

  useEffect(() => {
    // Get restaurant ID from localStorage first
    const restaurantData = localStorage.getItem(`restaurant-${cleanSlug}`);
    if (restaurantData) {
      try {
        const restaurant = JSON.parse(restaurantData);
        setRestaurantId(restaurant.id);
        return;
      } catch (error) {
        console.error("Failed to parse restaurant data:", error);
      }
    }

    // Fallback: Fetch from API
    const fetchRestaurantId = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        const response = await fetch(API_ENDPOINTS.restaurants.myRestaurants, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const restaurant = data.restaurants?.find(
            (r: any) => r.slug === cleanSlug,
          );
          if (restaurant) {
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
    };

    fetchRestaurantId();
  }, [cleanSlug]);

  useEffect(() => {
    if (!restaurantId) return;

    fetchOrders();

    // PERFORMANCE: Only poll when page is visible
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchOrders();
      }
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const fetchOrders = async () => {
    if (!restaurantId) return;

    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(API_ENDPOINTS.orders.list(restaurantId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Orders fetched successfully:", data.orders?.length || 0);
        setOrders(data.orders || []);
      } else {
        console.error("Failed to fetch orders:", response.status, response.statusText);
        setOrders([]);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrders((prev) => new Set(prev).add(orderId));

    // PERFORMANCE: Optimistic update - update UI immediately
    const previousOrders = [...orders];
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order,
      ),
    );

    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(API_ENDPOINTS.orders.updateStatus(orderId), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        // Revert on error
        setOrders(previousOrders);
        const error = await response.json();
        alert(`Failed to update order: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      // Revert on error
      setOrders(previousOrders);
      console.error("Failed to update order:", error);
      alert("Failed to update order. Please try again.");
    } finally {
      setUpdatingOrders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => order.status === filter);

  const filters = [
    { value: "all", label: "All Orders" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "preparing", label: "Preparing" },
    { value: "ready", label: "Ready" },
  ];

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);

    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} mins ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Order Management</h2>
        <p className="text-muted-foreground">
          View and manage incoming orders in real-time
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            onClick={() => setFilter(f.value)}
            className="transition-all duration-200"
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredOrders.map((order, index) => {
          const StatusIcon =
            statusConfig[order.status as keyof typeof statusConfig]?.icon ||
            AccessTimeIcon;
          const isUpdating = updatingOrders.has(order.id);
          const customerName = order.users
            ? `${order.users.first_name} ${order.users.last_name}`
            : "Customer";

          return (
            <Card
              key={order.id}
              className="group hover:shadow-lg transition-shadow duration-200"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold">
                            {order.order_number}
                          </h3>
                          <span
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5",
                              statusConfig[
                                order.status as keyof typeof statusConfig
                              ]?.color ||
                                "bg-gray-500/10 text-gray-500 border-gray-500/20",
                            )}
                          >
                            <StatusIcon sx={{ fontSize: 16 }} />
                            {statusConfig[
                              order.status as keyof typeof statusConfig
                            ]?.label || order.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <AccessTimeIcon sx={{ fontSize: 20 }} />
                            {getTimeAgo(order.created_at)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <LocationOnIcon sx={{ fontSize: 20 }} />
                            {order.delivery_address?.street || "N/A"},{" "}
                            {order.delivery_address?.city || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">{customerName}</p>
                      <div className="space-y-1">
                        {order.order_items.map((item) => (
                          <p
                            key={item.id}
                            className="text-sm text-muted-foreground"
                          >
                            {item.menu_items?.name || "Unknown Item"} x
                            {item.quantity}
                            {item.special_instructions && (
                              <span className="text-xs italic">
                                {" "}
                                - {item.special_instructions}
                              </span>
                            )}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      <span className="text-2xl font-bold">
                        AED {Number(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex lg:flex-col gap-2 lg:w-48">
                    {order.status === "pending" && (
                      <>
                        <Button
                          className="flex-1 lg:w-full gap-2 shadow-sm"
                          onClick={() =>
                            updateOrderStatus(order.id, "confirmed")
                          }
                          disabled={isUpdating}
                        >
                          <CheckCircleIcon sx={{ fontSize: 20 }} />
                          {isUpdating ? "Updating..." : "Accept"}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 lg:w-full gap-2 text-destructive hover:text-destructive"
                          onClick={() =>
                            updateOrderStatus(order.id, "cancelled")
                          }
                          disabled={isUpdating}
                        >
                          <CancelIcon sx={{ fontSize: 20 }} />
                          Reject
                        </Button>
                      </>
                    )}
                    {order.status === "confirmed" && (
                      <Button
                        className="flex-1 lg:w-full gap-2 shadow-sm"
                        onClick={() => updateOrderStatus(order.id, "preparing")}
                        disabled={isUpdating}
                      >
                        <LocalShippingIcon sx={{ fontSize: 20 }} />
                        {isUpdating ? "Updating..." : "Start Preparing"}
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button
                        className="flex-1 lg:w-full gap-2 shadow-sm"
                        onClick={() => updateOrderStatus(order.id, "ready")}
                        disabled={isUpdating}
                      >
                        <CheckCircleIcon sx={{ fontSize: 20 }} />
                        {isUpdating ? "Updating..." : "Mark Ready"}
                      </Button>
                    )}
                    {order.status === "ready" && (
                      <div className="flex-1 lg:w-full p-4 rounded-md bg-muted/50 border border-border text-center">
                        <p className="text-sm text-muted-foreground">
                          Waiting for driver pickup
                        </p>
                      </div>
                    )}
                    {order.status === "picked_up" && (
                      <div className="flex-1 lg:w-full p-4 rounded-md bg-green-50 border border-green-200 text-center">
                        <p className="text-sm text-green-700">
                          Out for delivery
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <LocalShippingIcon sx={{ fontSize: 64 }} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No orders found</h3>
          <p className="text-muted-foreground">
            {filter === "all"
              ? "No orders yet. New orders will appear here."
              : `No ${filter} orders at the moment.`}
          </p>
        </div>
      )}
    </div>
  );
}
