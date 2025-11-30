"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, MapPin, User, ChevronRight, RefreshCw } from "@/components/icons";
import { Button } from "@/components/ui/button";
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

export default function HistoryPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantSlug = decodeURIComponent(params.slug as string);
  const cleanSlug = useMemo(
    () =>
      restaurantSlug.startsWith("@")
        ? restaurantSlug.slice(1)
        : restaurantSlug,
    [restaurantSlug]
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

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

    // Check cache first (cache for 5 minutes)
    const cacheKey = `orders-history-${restaurantId}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTimestamp = localStorage.getItem(`${cacheKey}-timestamp`);

    if (cachedData && cacheTimestamp) {
      const cacheAge = Date.now() - parseInt(cacheTimestamp);
      if (cacheAge < 5 * 60 * 1000) { // 5 minutes
        setOrders(JSON.parse(cachedData));
        setLastFetchTime(new Date(parseInt(cacheTimestamp)));
        setIsLoading(false);
        return;
      }
    }

    fetchOrders();
  }, [restaurantId]);

  const fetchOrders = async () => {
    if (!restaurantId) return;

    setIsRefreshing(true);

    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(API_ENDPOINTS.orders.list(restaurantId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const ordersData = data.orders || [];
        setOrders(ordersData);

        // Cache the data
        const cacheKey = `orders-history-${restaurantId}`;
        const timestamp = Date.now();
        localStorage.setItem(cacheKey, JSON.stringify(ordersData));
        localStorage.setItem(`${cacheKey}-timestamp`, timestamp.toString());
        setLastFetchTime(new Date(timestamp));
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleOrderClick = (orderId: string) => {
    router.push(`/restaurant/${restaurantSlug}/orders/${orderId}`);
  };

  // Group orders by date
  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: Order[] } = {};

    orders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      orderDate.setHours(0, 0, 0, 0);
      const dateKey = orderDate.toISOString().split("T")[0];

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(order);
    });

    // Sort dates in descending order (newest first)
    const sortedDates = Object.keys(groups).sort((a, b) =>
      new Date(b).getTime() - new Date(a).getTime()
    );

    return sortedDates.map((dateKey) => ({
      date: dateKey,
      orders: groups[dateKey].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    }));
  }, [orders]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">Loading order history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tighter">Order History</h2>
          <p className="text-muted-foreground">
            View all past orders
            {lastFetchTime && (
              <span className="ml-2 text-xs">
                Last updated: {lastFetchTime.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={fetchOrders}
          disabled={isRefreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <div className="text-center py-12">
            <p className="text-muted-foreground">No orders found</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedOrders.map((group) => (
            <div key={group.date} className="space-y-3">
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {formatDate(group.date)}
                </h3>
              </div>

              <div className="border border-border rounded-lg overflow-hidden bg-card">
                <div className="divide-y divide-border">
                  {group.orders.map((order) => {
                    const customerName = order.users
                      ? `${order.users.first_name} ${order.users.last_name}`
                      : "Customer";

                    return (
                      <div
                        key={order.id}
                        onClick={() => handleOrderClick(order.id)}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors group"
                      >
                        {/* Time */}
                        <div className="flex-shrink-0 w-20">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(order.created_at)}
                          </p>
                        </div>

                        {/* Order Number */}
                        <div className="flex-shrink-0 w-40">
                          <p className="font-semibold text-sm whitespace-nowrap">
                            {order.order_number}
                          </p>
                        </div>

                        {/* Customer Name */}
                        <div className="flex-shrink-0 w-48">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{customerName}</span>
                          </p>
                        </div>

                        {/* Location - Takes up the center space */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground flex items-center gap-2 truncate">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">
                              {order.delivery_address?.street || "N/A"}
                            </span>
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="flex-shrink-0">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium border",
                            statusConfig[order.status as keyof typeof statusConfig]?.color || "bg-gray-50 text-gray-700 border-gray-200"
                          )}>
                            {statusConfig[order.status as keyof typeof statusConfig]?.label || order.status}
                          </span>
                        </div>

                        {/* Price */}
                        <div className="flex-shrink-0 w-28 text-right">
                          <p className="font-semibold text-sm">
                            AED {Number(order.total_amount).toFixed(2)}
                          </p>
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0">
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
