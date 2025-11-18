"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { cn } from "@/lib/utils";
import { io, Socket } from "socket.io-client";

interface Message {
  id: string;
  content: string;
  sender_role: "customer" | "support" | "admin";
  sender_id: string;
  message_type: "text" | "image" | "file" | "system";
  is_system_message: boolean;
  created_at: string;
  attachments?: any[];
}

interface ChatSession {
  id: string;
  subject: string;
  status: "waiting" | "active" | "closed";
  created_at: string;
  restaurant_id: string;
}

export default function SupportPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"waiting" | "active" | "closed">("waiting");
  const [isConnected, setIsConnected] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initializeChat = async () => {
      const token = localStorage.getItem("auth-token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!token || !user.id) {
        console.error("No authentication token or user found");
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:45000";

        const response = await fetch(`${apiUrl}/api/v1/chat/sessions/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const sessions = await response.json();
          const activeSession = sessions.find(
            (s: ChatSession) => s.status !== "closed" && s.restaurant_id === slug
          );

          if (activeSession) {
            setSessionId(activeSession.id);
            setSessionStatus(activeSession.status);
          } else {
            await createNewSession(token, slug);
          }
        } else {
          await createNewSession(token, slug);
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
        await createNewSession(token, slug);
      }
    };

    initializeChat();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [slug]);

  useEffect(() => {
    if (sessionId) {
      connectToSocket();
    }
  }, [sessionId]);

  const createNewSession = async (token: string, restaurantId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:45000";

    try {
      const response = await fetch(`${apiUrl}/api/v1/chat/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: "Restaurant Support Request",
          category: "restaurant_support",
          priority: "medium",
          restaurant_id: restaurantId,
          initial_message: "Hello, I need assistance with my restaurant.",
        }),
      });

      if (response.ok) {
        const session = await response.json();
        setSessionId(session.id);
        setSessionStatus(session.status);
      }
    } catch (error) {
      console.error("Error creating chat session:", error);
    }
  };

  const connectToSocket = () => {
    const token = localStorage.getItem("auth-token");
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:45000";

    const socket = io(wsUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Connected to chat server");
      setIsConnected(true);

      if (sessionId) {
        socket.emit("join_session", { session_id: sessionId });
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from chat server");
      setIsConnected(false);
    });

    socket.on("session_joined", (data) => {
      console.log("Joined session:", data);
      setMessages(data.messages || []);
      setSessionStatus(data.session.status);
    });

    socket.on("new_message", (data) => {
      console.log("New message:", data);
      setMessages((prev) => [...prev, data.message]);
    });

    socket.on("chat_accepted", (data) => {
      console.log("Chat accepted by agent:", data);
      setSessionStatus("active");
      const systemMessage: Message = {
        id: Date.now().toString(),
        content: `${data.agent_name} has joined the conversation`,
        sender_role: "support",
        sender_id: data.agent_id,
        message_type: "system",
        is_system_message: true,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, systemMessage]);
    });

    socket.on("user_typing", (data) => {
      setTypingUser(data.user_name);
    });

    socket.on("typing_stopped", () => {
      setTypingUser(null);
    });

    socket.on("chat_closed", () => {
      setSessionStatus("closed");
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    socketRef.current = socket;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || !socketRef.current || !sessionId) return;

    const tempId = Date.now().toString();

    socketRef.current.emit("send_message", {
      session_id: sessionId,
      content: inputMessage,
      message_type: "text",
      temp_id: tempId,
    });

    setInputMessage("");

    if (socketRef.current && sessionId) {
      socketRef.current.emit("stop_typing", { session_id: sessionId });
    }
  };

  const handleTyping = () => {
    if (socketRef.current && sessionId) {
      socketRef.current.emit("typing", { session_id: sessionId });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && sessionId) {
          socketRef.current.emit("stop_typing", { session_id: sessionId });
        }
      }, 3000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId) return;

    const token = localStorage.getItem("auth-token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:45000";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("session_id", sessionId);

    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/api/v1/chat/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("File uploaded:", data);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Support Chat</h2>
          <p className="text-gray-600">
            Get help with your restaurant portal or connect with our support team
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500"
            )}
          />
          <span className="text-sm text-gray-600">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
          {sessionStatus === "waiting" && (
            <span className="ml-4 text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
              Waiting for support...
            </span>
          )}
          {sessionStatus === "active" && (
            <span className="ml-4 text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
              Active
            </span>
          )}
        </div>
      </div>

      <Card className="bg-white rounded-xl shadow-sm border border-border/40 overflow-hidden">
        <div className="flex flex-col h-[600px]">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
            {messages.map((message) => (
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
            ))}
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
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || sessionStatus === "closed"}
              >
                <AttachFileIcon sx={{ fontSize: 20 }} />
              </Button>
              <Input
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  handleTyping();
                }}
                placeholder={
                  sessionStatus === "closed"
                    ? "Chat is closed"
                    : sessionStatus === "waiting"
                    ? "Waiting for support agent..."
                    : "Type your message..."
                }
                className="flex-1"
                disabled={isLoading || sessionStatus === "closed"}
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim() || isLoading || sessionStatus === "closed"}
                size="icon"
              >
                <SendIcon sx={{ fontSize: 20 }} />
              </Button>
            </form>
          </div>
        </div>
      </Card>
    </div>
  );
}
