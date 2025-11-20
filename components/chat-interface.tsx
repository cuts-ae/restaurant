"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Send, Upload, Clock } from "@/components/icons";
interface Message {
  id: string;
  content: string;
  sender_role: "customer" | "support" | "admin";
  sender_id: string;
  message_type: "text" | "image" | "file" | "system";
  is_system_message: boolean;
  created_at: string;
  attachments?: unknown[];
}

interface ChatInterfaceProps {
  messages: Message[];
  inputMessage: string;
  onInputChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTyping?: () => void;
  sessionStatus: "waiting" | "active" | "closed";
  isConnected: boolean;
  typingUser: string | null;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ChatInterface({
  messages,
  inputMessage,
  onInputChange,
  onSendMessage,
  onFileUpload,
  onTyping,
  sessionStatus,
  isConnected,
  typingUser,
  isLoading = false,
  disabled = false,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderWaitingState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="relative mb-6">
        <div className="rounded-full bg-yellow-100 p-6">
          <Clock className="h-12 w-12 text-yellow-600" />
        </div>
        <div className="absolute -top-1 -right-1">
          <span className="flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500"></span>
          </span>
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">Waiting for support agent...</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">
        A support agent will join shortly. You can send messages while you wait.
      </p>
      <div className="flex items-center gap-2 text-sm">
        <div className={cn(
          "h-2 w-2 rounded-full",
          isConnected ? "bg-green-500" : "bg-red-500"
        )} />
        <span className="text-muted-foreground">
          {isConnected ? "Connected" : "Reconnecting..."}
        </span>
      </div>
    </div>
  );

  const renderActiveChat = () => (
    <>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Start the conversation by sending a message</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.sender_role === "customer" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[70%] rounded-lg px-4 py-2",
                  message.is_system_message
                    ? "bg-gray-100 text-gray-600 text-center w-full max-w-full"
                    : message.sender_role === "customer"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                <p className="text-sm">{message.content}</p>
                {!message.is_system_message && (
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        {typingUser && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2">
              <p className="text-sm text-muted-foreground">
                {typingUser} is typing...
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border/40 p-4 bg-muted/10">
        <form onSubmit={onSendMessage} className="flex gap-2">
          {onFileUpload && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || sessionStatus === "closed" || disabled}
              >
                <Upload className="h-5 w-5" />
              </Button>
            </>
          )}
          <Input
            value={inputMessage}
            onChange={(e) => {
              onInputChange(e.target.value);
              onTyping?.();
            }}
            placeholder={
              sessionStatus === "closed"
                ? "Chat is closed"
                : sessionStatus === "waiting"
                ? "Type a message while waiting..."
                : "Type your message..."
            }
            className="flex-1"
            disabled={isLoading || sessionStatus === "closed" || disabled}
          />
          <Button
            type="submit"
            disabled={!inputMessage.trim() || isLoading || sessionStatus === "closed" || disabled}
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </>
  );

  // Main render logic
  if (!messages && sessionStatus === "waiting") {
    return renderWaitingState();
  }

  if (messages.length === 0 && sessionStatus === "waiting") {
    return (
      <div className="flex flex-col h-full">
        {renderWaitingState()}
      </div>
    );
  }

  return <>{renderActiveChat()}</>;
}
