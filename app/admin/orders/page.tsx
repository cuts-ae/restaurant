"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, ChevronDown } from "@/components/icons";
import { capitalizeStatus } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  restaurant: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  paymentMethod: string;
  date: string;
  time: string;
}

export default function AdminOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const orders: Order[] = [
    {
      id: "1",
      orderNumber: "ORD-2024-1234",
      customer: {
        name: "Ahmed Al Maktoum",
        phone: "+971 50 123 4567",
        email: "ahmed.almaktoum@email.ae",
      },
      restaurant: "The Butcher Shop",
      items: [
        { name: "Wagyu Ribeye Steak", quantity: 2, price: 180 },
        { name: "Lamb Chops", quantity: 1, price: 90 },
      ],
      total: 450,
      status: "completed",
      paymentMethod: "Credit Card",
      date: "2024-11-17",
      time: "14:30",
    },
    {
      id: "2",
      orderNumber: "ORD-2024-1235",
      customer: {
        name: "Fatima Hassan",
        phone: "+971 55 987 6543",
        email: "fatima.hassan@email.ae",
      },
      restaurant: "Prime Cuts",
      items: [
        { name: "Beef Tenderloin", quantity: 1, price: 220 },
        { name: "Grilled Vegetables", quantity: 2, price: 50 },
      ],
      total: 320,
      status: "preparing",
      paymentMethod: "Cash on Delivery",
      date: "2024-11-17",
      time: "14:45",
    },
    {
      id: "3",
      orderNumber: "ORD-2024-1236",
      customer: {
        name: "Mohammed Khan",
        phone: "+971 52 456 7890",
        email: "mohammed.khan@email.ae",
      },
      restaurant: "Grill House",
      items: [
        { name: "Mixed Grill Platter", quantity: 3, price: 150 },
        { name: "Caesar Salad", quantity: 2, price: 40 },
      ],
      total: 580,
      status: "completed",
      paymentMethod: "Credit Card",
      date: "2024-11-17",
      time: "13:20",
    },
    {
      id: "4",
      orderNumber: "ORD-2024-1237",
      customer: {
        name: "Aisha Patel",
        phone: "+971 56 234 5678",
        email: "aisha.patel@email.ae",
      },
      restaurant: "The Butcher Shop",
      items: [
        { name: "Chicken Breast", quantity: 4, price: 60 },
        { name: "Soup of the Day", quantity: 2, price: 15 },
      ],
      total: 295,
      status: "pending",
      paymentMethod: "Apple Pay",
      date: "2024-11-17",
      time: "15:10",
    },
    {
      id: "5",
      orderNumber: "ORD-2024-1238",
      customer: {
        name: "Omar Abdullah",
        phone: "+971 50 876 5432",
        email: "omar.abdullah@email.ae",
      },
      restaurant: "Prime Cuts",
      items: [
        { name: "T-Bone Steak", quantity: 2, price: 160 },
        { name: "Mashed Potatoes", quantity: 2, price: 50 },
      ],
      total: 420,
      status: "completed",
      paymentMethod: "Credit Card",
      date: "2024-11-17",
      time: "12:50",
    },
    {
      id: "6",
      orderNumber: "ORD-2024-1239",
      customer: {
        name: "Mariam Al Zaabi",
        phone: "+971 55 345 6789",
        email: "mariam.alzaabi@email.ae",
      },
      restaurant: "Grill House",
      items: [
        { name: "Lamb Biryani", quantity: 2, price: 120 },
        { name: "Garlic Naan", quantity: 4, price: 20 },
      ],
      total: 260,
      status: "ready",
      paymentMethod: "Cash on Delivery",
      date: "2024-11-17",
      time: "15:30",
    },
    {
      id: "7",
      orderNumber: "ORD-2024-1240",
      customer: {
        name: "Rajesh Kumar",
        phone: "+971 52 987 1234",
        email: "rajesh.kumar@email.ae",
      },
      restaurant: "The Butcher Shop",
      items: [
        { name: "BBQ Chicken Wings", quantity: 3, price: 80 },
        { name: "French Fries", quantity: 2, price: 30 },
      ],
      total: 270,
      status: "preparing",
      paymentMethod: "Google Pay",
      date: "2024-11-17",
      time: "15:45",
    },
    {
      id: "8",
      orderNumber: "ORD-2024-1241",
      customer: {
        name: "Noura Al Shamsi",
        phone: "+971 56 123 9876",
        email: "noura.alshamsi@email.ae",
      },
      restaurant: "Prime Cuts",
      items: [
        { name: "Seafood Platter", quantity: 1, price: 350 },
        { name: "Lemon Herb Rice", quantity: 1, price: 40 },
      ],
      total: 390,
      status: "completed",
      paymentMethod: "Credit Card",
      date: "2024-11-17",
      time: "11:30",
    },
  ];

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.phone.includes(searchQuery) ||
      order.restaurant.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "preparing":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "ready":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-2">
            Manage all orders across restaurants
          </p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Export Orders
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name, order number, phone, or restaurant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(
            [
              "all",
              "pending",
              "preparing",
              "ready",
              "completed",
              "cancelled",
            ] as const
          ).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {capitalizeStatus(status)} ({statusCounts[status]})
            </Button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">
                      {order.orderNumber}
                    </CardTitle>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}
                    >
                      {capitalizeStatus(order.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{order.date}</span>
                    <span>{order.time}</span>
                    <span className="font-medium text-foreground">
                      {order.restaurant}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">AED {order.total}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.paymentMethod}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                    Customer Details
                  </h4>
                  <div className="space-y-1">
                    <p className="font-medium">{order.customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer.phone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer.email}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                    Order Items
                  </h4>
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-muted-foreground">
                          AED {item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No orders found matching your criteria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
