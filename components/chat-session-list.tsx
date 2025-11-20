"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, Loader2 } from "@/components/icons";

interface ChatSession {
  id: string;
  subject: string;
  status: "waiting" | "active" | "closed";
  created_at: string;
  updated_at: string;
  last_message_preview?: string;
  unread_count?: number;
}

interface ChatSessionListProps {
  sessions: ChatSession[];
  selectedSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  isLoading?: boolean;
}

export function ChatSessionList({
  sessions,
  selectedSessionId,
  onSessionSelect,
  isLoading = false,
}: ChatSessionListProps) {
  const formatTimestamp = (dateString: string) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Waiting
          </Badge>
        );
      case "active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Active
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Closed
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Clock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No conversations yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Start a new chat to get help from our support team
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto">
      {sessions.map((session) => (
        <Card
          key={session.id}
          onClick={() => onSessionSelect(session.id)}
          className={cn(
            "p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50",
            selectedSessionId === session.id
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border/40 hover:bg-accent/50"
          )}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm mb-1 truncate">
                {session.subject}
              </h3>
              {session.last_message_preview && (
                <p className="text-xs text-muted-foreground truncate">
                  {session.last_message_preview}
                </p>
              )}
            </div>
            {session.unread_count && session.unread_count > 0 && (
              <Badge className="bg-primary text-primary-foreground">
                {session.unread_count}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            {getStatusBadge(session.status)}
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(session.updated_at)}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
