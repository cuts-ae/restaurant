"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Calendar,
  UserCheck,
  UserX,
} from "@/components/icons";
import { capitalizeStatus } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "restaurant_owner" | "admin";
  status: "active" | "inactive" | "suspended";
  location: {
    city: string;
    area: string;
  };
  stats: {
    totalOrders: number;
    totalSpent: number;
    lastOrder: string;
  };
  joinedDate: string;
  lastActive: string;
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const users: User[] = [
    {
      id: "1",
      name: "Ahmed Al Maktoum",
      email: "ahmed.almaktoum@email.ae",
      phone: "+971 50 123 4567",
      role: "customer",
      status: "active",
      location: {
        city: "Dubai",
        area: "DIFC",
      },
      stats: {
        totalOrders: 45,
        totalSpent: 12350,
        lastOrder: "2024-11-17",
      },
      joinedDate: "2024-01-15",
      lastActive: "2024-11-17 14:30",
    },
    {
      id: "2",
      name: "Fatima Hassan",
      email: "fatima.hassan@email.ae",
      phone: "+971 55 987 6543",
      role: "customer",
      status: "active",
      location: {
        city: "Dubai",
        area: "Dubai Marina",
      },
      stats: {
        totalOrders: 38,
        totalSpent: 9870,
        lastOrder: "2024-11-17",
      },
      joinedDate: "2024-02-20",
      lastActive: "2024-11-17 14:45",
    },
    {
      id: "3",
      name: "Mohammed Khan",
      email: "mohammed.khan@email.ae",
      phone: "+971 52 456 7890",
      role: "customer",
      status: "active",
      location: {
        city: "Dubai",
        area: "Jumeirah",
      },
      stats: {
        totalOrders: 52,
        totalSpent: 15420,
        lastOrder: "2024-11-17",
      },
      joinedDate: "2024-01-08",
      lastActive: "2024-11-17 13:20",
    },
    {
      id: "4",
      name: "Aisha Patel",
      email: "aisha.patel@email.ae",
      phone: "+971 56 234 5678",
      role: "customer",
      status: "active",
      location: {
        city: "Dubai",
        area: "Business Bay",
      },
      stats: {
        totalOrders: 29,
        totalSpent: 7890,
        lastOrder: "2024-11-17",
      },
      joinedDate: "2024-03-12",
      lastActive: "2024-11-17 15:10",
    },
    {
      id: "5",
      name: "Omar Abdullah",
      email: "omar.abdullah@email.ae",
      phone: "+971 50 876 5432",
      role: "customer",
      status: "active",
      location: {
        city: "Dubai",
        area: "Downtown",
      },
      stats: {
        totalOrders: 41,
        totalSpent: 11250,
        lastOrder: "2024-11-17",
      },
      joinedDate: "2024-02-05",
      lastActive: "2024-11-17 12:50",
    },
    {
      id: "6",
      name: "Mariam Al Zaabi",
      email: "mariam.alzaabi@email.ae",
      phone: "+971 55 345 6789",
      role: "customer",
      status: "active",
      location: {
        city: "Dubai",
        area: "Palm Jumeirah",
      },
      stats: {
        totalOrders: 33,
        totalSpent: 8920,
        lastOrder: "2024-11-17",
      },
      joinedDate: "2024-03-28",
      lastActive: "2024-11-17 15:30",
    },
    {
      id: "7",
      name: "Rajesh Kumar",
      email: "rajesh.kumar@email.ae",
      phone: "+971 52 987 1234",
      role: "customer",
      status: "active",
      location: {
        city: "Dubai",
        area: "Deira",
      },
      stats: {
        totalOrders: 27,
        totalSpent: 6540,
        lastOrder: "2024-11-17",
      },
      joinedDate: "2024-04-15",
      lastActive: "2024-11-17 15:45",
    },
    {
      id: "8",
      name: "Noura Al Shamsi",
      email: "noura.alshamsi@email.ae",
      phone: "+971 56 123 9876",
      role: "customer",
      status: "active",
      location: {
        city: "Dubai",
        area: "Arabian Ranches",
      },
      stats: {
        totalOrders: 36,
        totalSpent: 9340,
        lastOrder: "2024-11-17",
      },
      joinedDate: "2024-02-18",
      lastActive: "2024-11-17 11:30",
    },
    {
      id: "9",
      name: "Owner 1",
      email: "owner1@cuts.ae",
      phone: "+971 50 111 2222",
      role: "restaurant_owner",
      status: "active",
      location: {
        city: "Dubai",
        area: "DIFC",
      },
      stats: {
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: "N/A",
      },
      joinedDate: "2024-01-01",
      lastActive: "2024-11-17 16:00",
    },
    {
      id: "10",
      name: "Owner 2",
      email: "owner2@cuts.ae",
      phone: "+971 55 222 3333",
      role: "restaurant_owner",
      status: "active",
      location: {
        city: "Dubai",
        area: "Dubai Marina",
      },
      stats: {
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: "N/A",
      },
      joinedDate: "2024-01-01",
      lastActive: "2024-11-17 15:30",
    },
    {
      id: "11",
      name: "Admin User",
      email: "admin@cuts.ae",
      phone: "+971 50 999 8888",
      role: "admin",
      status: "active",
      location: {
        city: "Dubai",
        area: "DIFC",
      },
      stats: {
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: "N/A",
      },
      joinedDate: "2023-12-01",
      lastActive: "2024-11-17 16:30",
    },
    {
      id: "12",
      name: "Sara Malik",
      email: "sara.malik@email.ae",
      phone: "+971 56 789 4567",
      role: "customer",
      status: "inactive",
      location: {
        city: "Dubai",
        area: "JLT",
      },
      stats: {
        totalOrders: 12,
        totalSpent: 3200,
        lastOrder: "2024-09-15",
      },
      joinedDate: "2024-01-22",
      lastActive: "2024-10-05",
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery) ||
      user.location.area.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "restaurant_owner":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "customer":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "suspended":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const roleCounts = {
    all: users.length,
    customer: users.filter((u) => u.role === "customer").length,
    restaurant_owner: users.filter((u) => u.role === "restaurant_owner").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  const statusCounts = {
    all: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status === "inactive").length,
    suspended: users.filter((u) => u.status === "suspended").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage all users on the platform
          </p>
        </div>
        <Button>Add User</Button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex gap-2">
            <span className="text-sm font-medium py-2">Role:</span>
            {(["all", "customer", "restaurant_owner", "admin"] as const).map(
              (role) => (
                <Button
                  key={role}
                  variant={roleFilter === role ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRoleFilter(role)}
                  className="capitalize"
                >
                  {role.replace("_", " ")} ({roleCounts[role]})
                </Button>
              )
            )}
          </div>
          <div className="flex gap-2 border-l pl-4">
            <span className="text-sm font-medium py-2">Status:</span>
            {(["all", "active", "inactive", "suspended"] as const).map(
              (status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="capitalize"
                >
                  {capitalizeStatus(status)} ({statusCounts[status]})
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={getRoleColor(user.role)}>
                      {user.role.replace("_", " ")}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getStatusColor(user.status)}
                    >
                      {capitalizeStatus(user.status)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {user.location.area}, {user.location.city}
                  </span>
                </div>
              </div>

              {/* Stats for customers */}
              {user.role === "customer" && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xl font-bold">{user.stats.totalOrders}</p>
                    <p className="text-xs text-muted-foreground">Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">
                      {(user.stats.totalSpent / 1000).toFixed(1)}K
                    </p>
                    <p className="text-xs text-muted-foreground">Spent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium">
                      {user.stats.lastOrder !== "N/A"
                        ? new Date(user.stats.lastOrder).toLocaleDateString()
                        : "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">Last Order</p>
                  </div>
                </div>
              )}

              {/* Activity */}
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Joined {new Date(user.joinedDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserCheck className="h-4 w-4" />
                  <span>Last active: {user.lastActive}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" size="sm">
                  View Profile
                </Button>
                <Button variant="outline" className="flex-1" size="sm">
                  Edit
                </Button>
                {user.status === "active" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 hover:bg-green-50"
                  >
                    <UserCheck className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No users found matching your criteria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
