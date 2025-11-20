"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Send,
  Loader2,
  X,
  FileText,
} from "@/components/icons";
import { API_ENDPOINTS } from "@/lib/api";

interface Message {
  id: string;
  message: string;
  user_id: string | null;
  is_internal: boolean;
  created_at: string;
  author_name?: string;
  author_email?: string;
}

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  created_at: string;
  updated_at: string;
  reply_count: number;
  last_reply_at: string | null;
  messages?: Message[];
}

const REPLY_TEMPLATES = [
  {
    id: "template-1",
    title: "Investigating Issue",
    text: "I apologize for the inconvenience. I'm currently investigating this issue and will get back to you as soon as possible.",
  },
  {
    id: "template-2",
    title: "Looking Into It",
    text: "Thank you for reaching out. Let me look into this for you.",
  },
  {
    id: "template-3",
    title: "Working on Resolution",
    text: "I understand your concern. We're working on resolving this right away.",
  },
  {
    id: "template-4",
    title: "Escalated",
    text: "Your issue has been escalated to our technical team.",
  },
  {
    id: "template-5",
    title: "Issue Resolved",
    text: "This has been resolved. Please let me know if you need anything else.",
  },
  {
    id: "template-6",
    title: "Thank You",
    text: "Thank you for your patience. The issue should be fixed now.",
  },
];

export default function SupportTicketsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedTicket?.messages) {
      scrollToBottom();
    }
  }, [selectedTicket?.messages]);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(API_ENDPOINTS.support.getTickets, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const fetchTicketDetails = async (ticketId: string) => {
    setIsLoadingMessages(true);
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        API_ENDPOINTS.support.getTicketById(ticketId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedTicket(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch ticket details:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    setIsSendingReply(true);
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        API_ENDPOINTS.support.addReply(selectedTicket.id),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: replyMessage,
            is_internal: false,
          }),
        }
      );

      if (response.ok) {
        setReplyMessage("");
        await fetchTicketDetails(selectedTicket.id);
      }
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleTemplateClick = (templateText: string) => {
    setReplyMessage(templateText);
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  if (selectedTicket) {
    return (
      <div className="space-y-6 h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTicket(null)}
              >
                <X className="h-4 w-4 mr-2" />
                Back to Tickets
              </Button>
              <h1 className="text-2xl font-bold tracking-tight">
                {selectedTicket.subject}
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className={getStatusColor(selectedTicket.status)}
              >
                {selectedTicket.status === "in_progress"
                  ? "In Progress"
                  : selectedTicket.status.charAt(0).toUpperCase() +
                    selectedTicket.status.slice(1)}
              </Badge>
              <Badge
                variant="outline"
                className={getPriorityColor(selectedTicket.priority)}
              >
                {selectedTicket.priority.charAt(0).toUpperCase() +
                  selectedTicket.priority.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {selectedTicket.ticket_number}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-5rem)]">
          {/* Chat Area - Left/Center */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <Card className="flex-1 flex flex-col h-full">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Conversation</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : selectedTicket.messages &&
                    selectedTicket.messages.length > 0 ? (
                    selectedTicket.messages.map((msg, index) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col gap-1 ${
                          msg.user_id ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-3 rounded-lg shadow-sm ${
                            msg.user_id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground px-1">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-sm text-muted-foreground">
                        No messages yet
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input */}
                {selectedTicket.status !== "closed" && (
                  <form
                    onSubmit={handleSendReply}
                    className="p-4 border-t bg-background"
                  >
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your response..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        disabled={isSendingReply}
                        rows={3}
                        className="resize-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply(e);
                          }
                        }}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={isSendingReply || !replyMessage.trim()}
                        className="h-[76px] w-12 flex-shrink-0"
                      >
                        {isSendingReply ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Reply Templates - Right Side */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Quick Replies
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 overflow-y-auto h-[calc(100%-5rem)]">
                {REPLY_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateClick(template.text)}
                    disabled={selectedTicket.status === "closed"}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-transparent"
                  >
                    <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                      {template.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.text}
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground mt-2">
            Manage customer support tickets and inquiries
          </p>
        </div>
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
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting response
            </p>
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
            placeholder="Search by ticket number, subject, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

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
      </div>

      <div className="space-y-4">
        {isLoadingTickets ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No support tickets found matching your criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => fetchTicketDetails(ticket.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-semibold">
                        {ticket.ticket_number}
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
                    <CardTitle className="text-lg mb-2">
                      {ticket.subject}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {formatTime(ticket.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>
                      {ticket.reply_count} response
                      {ticket.reply_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
