"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  MapPin,
  DollarSign,
  Package,
  CheckCircle2,
  XCircle,
} from "lucide-react";
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
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: Package,
  },
  preparing: {
    label: "Preparing",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: Package,
  },
  ready: {
    label: "Ready",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: CheckCircle2,
  },
  picked_up: {
    label: "Picked Up",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: CheckCircle2,
  },
};

export default function OrdersPage() {
  const params = useParams();
  const restaurantSlug = params.slug as string;

  const [filter, setFilter] = useState<string>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
  const [restaurantId, setRestaurantId] = useState<string>("");

  useEffect(() => {
    const fetchRestaurantId = async () => {
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
          setRestaurantId(data.restaurant?.id || "");
        }
      } catch (error) {
        console.error("Failed to fetch restaurant:", error);
      }
    };

    fetchRestaurantId();
  }, [restaurantSlug]);

  useEffect(() => {
    if (!restaurantId) return;

    fetchOrders();
    // Poll for new orders every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const fetchOrders = async () => {
    if (!restaurantId) return;

    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        API_ENDPOINTS.orders.list(restaurantId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrders((prev) => new Set(prev).add(orderId));
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        API_ENDPOINTS.orders.updateStatus(orderId),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        await fetchOrders();
      } else {
        const error = await response.json();
        alert(`Failed to update order: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
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
            Clock;
          const isUpdating = updatingOrders.has(order.id);
          const customerName = order.users
            ? `${order.users.first_name} ${order.users.last_name}`
            : "Customer";

          return (
            <Card
              key={order.id}
              className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.01] animate-in fade-in slide-in-from-left-4"
              style={{ animationDelay: `${index * 50}ms` }}
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
                                "bg-gray-500/10 text-gray-500 border-gray-500/20"
                            )}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[
                              order.status as keyof typeof statusConfig
                            ]?.label || order.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {getTimeAgo(order.created_at)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {order.delivery_address.street},{" "}
                            {order.delivery_address.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">{customerName}</p>
                      <div className="space-y-1">
                        {order.order_items.map((item) => (
                          <p key={item.id} className="text-sm text-muted-foreground">
                            {item.menu_items.name} x{item.quantity}
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
                      <DollarSign className="w-5 h-5 text-muted-foreground" />
                      <span className="text-2xl font-bold">
                        AED {order.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex lg:flex-col gap-2 lg:w-48">
                    {order.status === "pending" && (
                      <>
                        <Button
                          className="flex-1 lg:w-full gap-2 shadow-sm"
                          onClick={() => updateOrderStatus(order.id, "confirmed")}
                          disabled={isUpdating}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {isUpdating ? "Updating..." : "Accept"}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 lg:w-full gap-2 text-destructive hover:text-destructive"
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                          disabled={isUpdating}
                        >
                          <XCircle className="w-4 h-4" />
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
                        <Package className="w-4 h-4" />
                        {isUpdating ? "Updating..." : "Start Preparing"}
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button
                        className="flex-1 lg:w-full gap-2 shadow-sm"
                        onClick={() => updateOrderStatus(order.id, "ready")}
                        disabled={isUpdating}
                      >
                        <CheckCircle2 className="w-4 h-4" />
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
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
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
