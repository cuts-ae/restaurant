"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Mail,
  Phone,
} from "@/components/icons";

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  responseCount: number;
}

export default function AdminSupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const tickets: SupportTicket[] = [
    {
      id: "1",
      ticketNumber: "TICK-001",
      subject: "Order delivery issue",
      description: "My order was delivered late and food was cold",
      customer: {
        name: "Ahmed Al Maktoum",
        email: "ahmed@email.ae",
        phone: "+971 50 123 4567",
      },
      status: "in_progress",
      priority: "high",
      category: "Delivery",
      createdAt: "2024-11-17T10:30:00",
      updatedAt: "2024-11-17T14:20:00",
      assignedTo: "Support Agent 1",
      responseCount: 3,
    },
    {
      id: "2",
      ticketNumber: "TICK-002",
      subject: "Payment not processed",
      description: "I paid but order shows as pending",
      customer: {
        name: "Fatima Hassan",
        email: "fatima@email.ae",
        phone: "+971 55 987 6543",
      },
      status: "open",
      priority: "urgent",
      category: "Payment",
      createdAt: "2024-11-17T15:45:00",
      updatedAt: "2024-11-17T15:45:00",
      responseCount: 0,
    },
    {
      id: "3",
      ticketNumber: "TICK-003",
      subject: "Menu item missing",
      description: "One item was missing from my order",
      customer: {
        name: "Mohammed Khan",
        email: "mohammed@email.ae",
        phone: "+971 52 456 7890",
      },
      status: "resolved",
      priority: "medium",
      category: "Order",
      createdAt: "2024-11-16T12:00:00",
      updatedAt: "2024-11-17T09:30:00",
      assignedTo: "Support Agent 2",
      responseCount: 5,
    },
    {
      id: "4",
      ticketNumber: "TICK-004",
      subject: "Account access problem",
      description: "Cannot login to my account",
      customer: {
        name: "Aisha Patel",
        email: "aisha@email.ae",
        phone: "+971 56 234 5678",
      },
      status: "in_progress",
      priority: "high",
      category: "Account",
      createdAt: "2024-11-17T08:15:00",
      updatedAt: "2024-11-17T11:00:00",
      assignedTo: "Support Agent 1",
      responseCount: 2,
    },
    {
      id: "5",
      ticketNumber: "TICK-005",
      subject: "Refund request",
      description: "Want to get refund for cancelled order",
      customer: {
        name: "Omar Abdullah",
        email: "omar@email.ae",
        phone: "+971 50 876 5432",
      },
      status: "open",
      priority: "medium",
      category: "Refund",
      createdAt: "2024-11-17T14:00:00",
      updatedAt: "2024-11-17T14:00:00",
      responseCount: 0,
    },
    {
      id: "6",
      ticketNumber: "TICK-006",
      subject: "Restaurant feedback",
      description: "Food quality was excellent, want to compliment chef",
      customer: {
        name: "Sara Malik",
        email: "sara@email.ae",
        phone: "+971 56 789 4567",
      },
      status: "resolved",
      priority: "low",
      category: "Feedback",
      createdAt: "2024-11-16T18:30:00",
      updatedAt: "2024-11-17T10:00:00",
      assignedTo: "Support Agent 3",
      responseCount: 1,
    },
    {
      id: "7",
      ticketNumber: "TICK-007",
      subject: "Wrong order delivered",
      description: "Received different items than what I ordered",
      customer: {
        name: "Khalid Al Zaabi",
        email: "khalid@email.ae",
        phone: "+971 55 345 6789",
      },
      status: "in_progress",
      priority: "high",
      category: "Order",
      createdAt: "2024-11-17T13:20:00",
      updatedAt: "2024-11-17T15:10:00",
      assignedTo: "Support Agent 2",
      responseCount: 4,
    },
    {
      id: "8",
      ticketNumber: "TICK-008",
      subject: "App not working",
      description: "Mobile app crashes when trying to place order",
      customer: {
        name: "Noura Al Shamsi",
        email: "noura@email.ae",
        phone: "+971 56 123 9876",
      },
      status: "open",
      priority: "urgent",
      category: "Technical",
      createdAt: "2024-11-17T16:00:00",
      updatedAt: "2024-11-17T16:00:00",
      responseCount: 0,
    },
  ];

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;

    const matchesPriority =
      priorityFilter === "all" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "resolved":
        return "bg-green-100 text-green-700 border-green-200";
      case "closed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground mt-2">
            Manage customer support requests
          </p>
        </div>
        <Button>Create Ticket</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.open}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.inProgress}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Being handled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.resolved}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ticket number, subject, customer, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium">Status:</span>
            {["all", "open", "in_progress", "resolved", "closed"].map(
              (status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="capitalize"
                >
                  {status.replace("_", " ")}
                </Button>
              )
            )}
          </div>
          <div className="flex gap-2 items-center border-l pl-4">
            <span className="text-sm font-medium">Priority:</span>
            {["all", "urgent", "high", "medium", "low"].map((priority) => (
              <Button
                key={priority}
                variant={priorityFilter === priority ? "default" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter(priority)}
                className="capitalize"
              >
                {priority}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm font-semibold">
                      {ticket.ticketNumber}
                    </span>
                    <Badge
                      variant="outline"
                      className={getStatusColor(ticket.status)}
                    >
                      {ticket.status === "in_progress"
                        ? "In Progress"
                        : ticket.status.charAt(0).toUpperCase() +
                          ticket.status.slice(1)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getPriorityColor(ticket.priority)}
                    >
                      {ticket.priority.charAt(0).toUpperCase() +
                        ticket.priority.slice(1)}
                    </Badge>
                    <Badge variant="outline">{ticket.category}</Badge>
                  </div>
                  <CardTitle className="text-lg mb-2">{ticket.subject}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {ticket.description}
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
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{ticket.customer.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {ticket.customer.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {ticket.customer.phone}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                    Ticket Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Created: {new Date(ticket.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Updated: {new Date(ticket.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    {ticket.assignedTo && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Assigned to: {ticket.assignedTo}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {ticket.responseCount} response
                        {ticket.responseCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                {ticket.status === "open" && (
                  <Button size="sm" className="flex-1">
                    Assign to Me
                  </Button>
                )}
                {ticket.status === "in_progress" && (
                  <Button size="sm" variant="default" className="flex-1">
                    Mark Resolved
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No support tickets found matching your criteria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
