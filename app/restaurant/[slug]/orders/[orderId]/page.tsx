"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, User, Phone, ArrowLeft } from "@/components/icons";
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
    description?: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_fee: number;
  service_fee: number;
  created_at: string;
  updated_at: string;
  delivery_address: {
    street: string;
    city: string;
    building?: string;
    floor?: string;
    apartment?: string;
    additional_directions?: string;
  };
  order_items: OrderItem[];
  users?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  restaurant?: {
    name: string;
  };
}

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  preparing: {
    label: "Preparing",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  ready: {
    label: "Ready",
    color: "bg-green-50 text-green-700 border-green-200",
  },
  delivered: {
    label: "Delivered",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-50 text-red-700 border-red-200",
  },
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantSlug = decodeURIComponent(params.slug as string);
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(API_ENDPOINTS.orders.getById(orderId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else {
        console.error("Failed to fetch order details");
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return;

    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(API_ENDPOINTS.orders.updateStatus(order.id), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrderDetails();
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-lg text-muted-foreground">Order not found</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const customerName = order.users
    ? `${order.users.first_name} ${order.users.last_name}`
    : "Customer";
  const nextStatus = getNextStatus(order.status);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Order Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold tracking-tight">
            Order {order.order_number}
          </h2>
          <Badge
            className={cn(
              "border",
              statusConfig[order.status as keyof typeof statusConfig]?.color ||
                "bg-gray-100 text-gray-700"
            )}
          >
            {statusConfig[order.status as keyof typeof statusConfig]?.label ||
              order.status}
          </Badge>
        </div>
        <p className="text-muted-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Placed on {formatDateTime(order.created_at)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Order Items & Invoice */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{item.menu_items.name}</p>
                      {item.menu_items.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.menu_items.description}
                        </p>
                      )}
                      {item.special_instructions && (
                        <p className="text-sm text-amber-600 mt-1">
                          Special instructions: {item.special_instructions}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Quantity: {item.quantity} x AED {Number(item.base_price).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold">
                        AED {Number(item.item_total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="font-medium">
                    AED {Number(order.delivery_fee || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Service Fee</span>
                  <span className="font-medium">
                    AED {Number(order.service_fee || 0).toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold">
                    AED {Number(order.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Customer & Delivery Info */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{customerName}</p>
              </div>
              {order.users?.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{order.users.email}</p>
                </div>
              )}
              {order.users?.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {order.users.phone}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="font-medium">{order.delivery_address?.street || "N/A"}</p>
                <p className="text-sm text-muted-foreground">
                  {order.delivery_address?.city || "N/A"}
                </p>
              </div>
              {order.delivery_address?.building && (
                <p className="text-sm">
                  Building: {order.delivery_address.building}
                </p>
              )}
              {order.delivery_address?.floor && (
                <p className="text-sm">
                  Floor: {order.delivery_address.floor}
                </p>
              )}
              {order.delivery_address?.apartment && (
                <p className="text-sm">
                  Apartment: {order.delivery_address.apartment}
                </p>
              )}
              {order.delivery_address?.additional_directions && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Additional Directions
                  </p>
                  <p className="text-sm mt-1">
                    {order.delivery_address.additional_directions}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Update Status */}
          {nextStatus && (
            <Card className="print:hidden">
              <CardHeader>
                <CardTitle>Update Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleUpdateStatus(nextStatus)}
                  className="w-full gap-2"
                >
                  Mark as{" "}
                  {statusConfig[nextStatus as keyof typeof statusConfig]?.label}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
