"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, Phone } from "@/components/icons";
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
    phone?: string;
  };
}

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dotColor: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dotColor: "bg-blue-500",
  },
  preparing: {
    label: "Preparing",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    dotColor: "bg-purple-500",
  },
  ready: {
    label: "Ready",
    color: "bg-green-50 text-green-700 border-green-200",
    dotColor: "bg-green-500",
  },
  delivered: {
    label: "Delivered",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotColor: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-50 text-red-700 border-red-200",
    dotColor: "bg-red-500",
  },
};

export default function OrdersPage() {
  const params = useParams();
  const restaurantSlug = decodeURIComponent(params.slug as string);
  const cleanSlug = useMemo(
    () =>
      restaurantSlug.startsWith("@")
        ? restaurantSlug.slice(1)
        : restaurantSlug,
    [restaurantSlug]
  );

  const [activeTab, setActiveTab] = useState<string>("pending");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string>("");

  useEffect(() => {
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
            (r: { slug: string }) => r.slug === cleanSlug,
          );
          if (restaurant) {
            setRestaurantId(restaurant.id);
            localStorage.setItem(
              `restaurant-${cleanSlug}`,
              JSON.stringify(restaurant),
            );
          } else {
            setIsLoading(false);
          }
        } else {
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

    // Poll every 5 seconds for real-time updates
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchOrders();
      }
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const fetchOrders = async () => {
    if (!restaurantId) return;

    try {
      const token = localStorage.getItem("auth-token");
      const url = API_ENDPOINTS.orders.list(restaurantId);
      console.log("Fetching orders from:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Received orders:", data.orders?.length || 0);

        // Filter for today's orders only
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaysOrders = (data.orders || []).filter((order: Order) => {
          const orderDate = new Date(order.created_at);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime();
        });

        console.log("Today's orders:", todaysOrders.length);
        console.log("Orders by status:", {
          pending: todaysOrders.filter((o: Order) => o.status === 'pending').length,
          confirmed: todaysOrders.filter((o: Order) => o.status === 'confirmed').length,
          preparing: todaysOrders.filter((o: Order) => o.status === 'preparing').length,
          ready: todaysOrders.filter((o: Order) => o.status === 'ready').length,
          delivered: todaysOrders.filter((o: Order) => o.status === 'delivered').length,
        });

        setOrders(todaysOrders);
      } else {
        console.error("Failed to fetch orders, status:", response.status);
        setOrders([]);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(API_ENDPOINTS.orders.updateStatus(orderId), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  const getFilteredOrders = (status: string) => {
    if (status === "all") return orders;
    return orders.filter((order) => order.status === status);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "delivered",
    ];
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === statusFlow.length - 1)
      return null;
    return statusFlow[currentIndex + 1];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tighter">Today's Orders</h2>
        <p className="text-muted-foreground">
          Manage and track orders received today
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-5 h-11">
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {getFilteredOrders("pending").length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-amber-500 text-white rounded-full">
                {getFilteredOrders("pending").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="gap-2">
            Confirmed
            {getFilteredOrders("confirmed").length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
                {getFilteredOrders("confirmed").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="preparing" className="gap-2">
            Preparing
            {getFilteredOrders("preparing").length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-purple-500 text-white rounded-full">
                {getFilteredOrders("preparing").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="ready" className="gap-2">
            Ready
            {getFilteredOrders("ready").length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded-full">
                {getFilteredOrders("ready").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="delivered" className="gap-2">
            Delivered
            {getFilteredOrders("delivered").length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-emerald-500 text-white rounded-full">
                {getFilteredOrders("delivered").length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {["pending", "confirmed", "preparing", "ready", "delivered"].map((status) => (
          <TabsContent key={status} value={status} className="mt-6">
            {getFilteredOrders(status).length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">
                    No {status === "all" ? "" : status} orders today
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {getFilteredOrders(status).map((order) => {
                  const customerName = order.users
                    ? `${order.users.first_name} ${order.users.last_name}`
                    : "Customer";
                  const nextStatus = getNextStatus(order.status);

                  return (
                    <Card
                      key={order.id}
                      className="hover:shadow-lg transition-all duration-300"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-xl">
                                Order {order.order_number}
                              </CardTitle>
                              <Badge
                                className={cn(
                                  "border",
                                  statusConfig[
                                    order.status as keyof typeof statusConfig
                                  ]?.color || "bg-gray-100 text-gray-700"
                                )}
                              >
                                {statusConfig[
                                  order.status as keyof typeof statusConfig
                                ]?.label || order.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatTime(order.created_at)}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {customerName}
                              </div>
                              {order.users?.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-4 h-4" />
                                  {order.users.phone}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">
                              AED {Number(order.total_amount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Order Items</h4>
                          <div className="space-y-2">
                            {order.order_items && order.order_items.length > 0 ? (
                              order.order_items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium">
                                      {item.menu_items?.name || "Unknown Item"}
                                    </p>
                                    {item.special_instructions && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Note: {item.special_instructions}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm text-muted-foreground">
                                      Qty: {item.quantity}
                                    </span>
                                    <span className="font-medium">
                                      AED {Number(item.item_total).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground py-2">
                                No items in this order
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-2 pt-2">
                          <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              Delivery Address
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.delivery_address?.street || "N/A"},{" "}
                              {order.delivery_address?.city || "N/A"}
                            </p>
                          </div>
                        </div>

                        {nextStatus && (
                          <div className="flex justify-end pt-2 border-t">
                            <Button
                              onClick={() =>
                                handleUpdateStatus(order.id, nextStatus)
                              }
                              className="gap-2"
                            >
                              Mark as{" "}
                              {
                                statusConfig[
                                  nextStatus as keyof typeof statusConfig
                                ]?.label
                              }
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
