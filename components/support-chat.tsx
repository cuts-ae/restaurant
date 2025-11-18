"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ChatIcon from "@mui/icons-material/Chat";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import CircularProgress from "@mui/material/CircularProgress";
import { API_ENDPOINTS } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  message: string;
  user_id: string | null;
  is_internal: boolean;
  created_at: string;
  author_name?: string;
  author_email?: string;
}

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
  reply_count: number;
  last_reply_at: string | null;
  messages?: Message[];
}

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat" | "new">("list");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // New ticket form
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reply form
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (view === "chat" && selectedTicket?.messages) {
      scrollToBottom();
    }
  }, [view, selectedTicket?.messages]);

  useEffect(() => {
    if (isOpen && view === "list") {
      fetchTickets();
    }
  }, [isOpen, view]);

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
      const response = await fetch(API_ENDPOINTS.support.getTicketById(ticketId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTicket(data.data);
        setView("chat");
      }
    } catch (err) {
      console.error("Failed to fetch ticket details:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("auth-token");
      const user = localStorage.getItem("user");
      let userId = null;

      if (user) {
        try {
          const userData = JSON.parse(user);
          userId = userData.id;
        } catch (e) {
          console.error("Failed to parse user data:", e);
        }
      }

      const response = await fetch(API_ENDPOINTS.support.createTicket, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          message,
          created_by: userId,
          category: "general",
          priority: "medium",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create ticket");
      }

      const data = await response.json();
      setSubject("");
      setMessage("");

      // Refresh tickets and show the new one
      await fetchTickets();
      if (data.data?.id) {
        await fetchTicketDetails(data.data.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setIsSubmitting(false);
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
        // Refresh ticket details to show new message
        await fetchTicketDetails(selectedTicket.id);
      }
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <ErrorIcon sx={{ fontSize: 20 }} className="text-blue-500" />;
      case "in_progress":
        return <CircularProgress size={16} className="text-orange-500" />;
      case "closed":
        return <CheckCircleIcon sx={{ fontSize: 20 }} className="text-green-500" />;
      default:
        return <AccessTimeIcon sx={{ fontSize: 20 }} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "in_progress":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "closed":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderTicketList = () => (
    <div className="flex flex-col h-full">
      <DialogHeader className="px-6 py-4 border-b border-border/50">
        <DialogTitle className="text-xl font-semibold">Support</DialogTitle>
        <DialogDescription>
          View your conversations or start a new one
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoadingTickets ? (
          <div className="flex items-center justify-center py-12">
            <CircularProgress size={32} className="text-muted-foreground" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ChatIcon sx={{ fontSize: 48 }} className="text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground mb-6">
              No conversations yet
            </p>
            <Button onClick={() => setView("new")} size="sm">
              Start a conversation
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => fetchTicketDetails(ticket.id)}
                className="w-full text-left p-4 rounded-lg border border-border/50 hover:border-border hover:bg-accent/50 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm mb-1 truncate group-hover:text-primary transition-colors">
                      {ticket.subject}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {getStatusIcon(ticket.status)}
                      <span className="capitalize">{ticket.status.replace("_", " ")}</span>
                      <span>•</span>
                      <span>{formatDate(ticket.created_at)}</span>
                    </div>
                  </div>
                  {ticket.reply_count > 0 && (
                    <div className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                      <ChatIcon sx={{ fontSize: 16 }} />
                      <span>{ticket.reply_count}</span>
                    </div>
                  )}
                </div>
                <div
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                    getStatusColor(ticket.status)
                  )}
                >
                  {ticket.ticket_number}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border/50">
        <Button
          onClick={() => setView("new")}
          className="w-full gap-2"
          size="lg"
        >
          <ChatIcon sx={{ fontSize: 20 }} />
          New Conversation
        </Button>
      </div>
    </div>
  );

  const renderNewTicketForm = () => (
    <div className="flex flex-col h-full">
      <DialogHeader className="px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView("list")}
            className="h-8 w-8"
          >
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </Button>
          <div>
            <DialogTitle className="text-xl font-semibold">
              New Conversation
            </DialogTitle>
            <DialogDescription>
              Describe your issue and we&apos;ll get back to you soon
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleCreateTicket} className="flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              Subject
            </label>
            <Input
              id="subject"
              placeholder="What do you need help with?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              disabled={isSubmitting}
              className="transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Message
            </label>
            <Textarea
              id="message"
              placeholder="Describe your issue or question in detail..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              disabled={isSubmitting}
              rows={8}
              className="resize-none transition-all"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-1 duration-200">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border/50">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full gap-2"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={16} className="text-current" />
                Creating...
              </>
            ) : (
              <>
                <SendIcon sx={{ fontSize: 20 }} />
                Start Conversation
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );

  const renderChat = () => {
    if (!selectedTicket) return null;

    return (
      <div className="flex flex-col h-full">
        <DialogHeader className="px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setView("list");
                setSelectedTicket(null);
              }}
              className="h-8 w-8"
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </Button>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold truncate">
                {selectedTicket.subject}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                    getStatusColor(selectedTicket.status)
                  )}
                >
                  {getStatusIcon(selectedTicket.status)}
                  <span className="ml-1 capitalize">
                    {selectedTicket.status.replace("_", " ")}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedTicket.ticket_number}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center py-12">
              <CircularProgress size={32} className="text-muted-foreground" />
            </div>
          ) : selectedTicket.messages && selectedTicket.messages.length > 0 ? (
            selectedTicket.messages.map((msg, index) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.user_id ? "items-end" : "items-start"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={cn(
                    "max-w-[85%] px-4 py-3 rounded-2xl shadow-sm",
                    msg.user_id
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  )}
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
              <p className="text-sm text-muted-foreground">No messages yet</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {selectedTicket.status !== "closed" && (
          <form onSubmit={handleSendReply} className="p-4 border-t border-border/50">
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                disabled={isSendingReply}
                rows={1}
                className="resize-none min-h-[44px] max-h-[120px] transition-all"
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
                className="h-11 w-11 flex-shrink-0"
              >
                {isSendingReply ? (
                  <CircularProgress size={16} className="text-current" />
                ) : (
                  <SendIcon sx={{ fontSize: 20 }} />
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 border-2 hover:scale-105"
        >
          <ChatIcon sx={{ fontSize: 28 }} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[700px] p-0 gap-0 overflow-hidden">
        {view === "list" && renderTicketList()}
        {view === "new" && renderNewTicketForm()}
        {view === "chat" && renderChat()}
      </DialogContent>
    </Dialog>
  );
}
