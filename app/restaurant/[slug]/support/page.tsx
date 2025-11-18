"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { io, Socket } from "socket.io-client";
import { ChatSessionList } from "@/components/chat-session-list";
import { NewChatDialog } from "@/components/new-chat-dialog";
import { ChatInterface } from "@/components/chat-interface";
import AddIcon from "@mui/icons-material/Add";
import CircularProgress from "@mui/material/CircularProgress";

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

interface ChatSession {
  id: string;
  subject: string;
  status: "waiting" | "active" | "closed";
  created_at: string;
  updated_at: string;
  restaurant_id: string;
  last_message_preview?: string;
  unread_count?: number;
}

export default function SupportPage() {
  const params = useParams();
  const slug = params.slug as string;

  // Restaurant state
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(true);

  // Sessions state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // Messages state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Chat state
  const [sessionStatus, setSessionStatus] = useState<"waiting" | "active" | "closed">("waiting");
  const [isConnected, setIsConnected] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // New chat dialog
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch restaurant UUID from slug on mount
  useEffect(() => {
    const fetchRestaurant = async () => {
      setIsLoadingRestaurant(true);
      try {
        const token = localStorage.getItem("auth-token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:45000";
        const response = await fetch(`${apiUrl}/api/v1/restaurants/${slug}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch restaurant: ${response.status}`);
        }

        const data = await response.json();
        const restaurant = data.restaurant || data;

        if (!restaurant || !restaurant.id) {
          throw new Error("Invalid restaurant data received");
        }

        console.log("Loaded restaurant:", restaurant.id, "for slug:", slug);
        setRestaurantId(restaurant.id);
      } catch (error) {
        console.error("Error fetching restaurant:", error);
        setSessionsError(error instanceof Error ? error.message : "Failed to load restaurant");
      } finally {
        setIsLoadingRestaurant(false);
      }
    };

    fetchRestaurant();
  }, [slug]);

  // Fetch all sessions when restaurant ID is available
  useEffect(() => {
    if (restaurantId) {
      fetchSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // Connect to socket when a session is selected
  useEffect(() => {
    if (selectedSessionId) {
      connectToSocket(selectedSessionId);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [selectedSessionId]);

  const fetchSessions = async () => {
    if (!restaurantId) {
      console.log("Skipping fetchSessions - restaurantId not yet loaded");
      return;
    }

    setIsLoadingSessions(true);
    setSessionsError(null);

    try {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:45000";
      const response = await fetch(`${apiUrl}/api/v1/chat/sessions/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error Response:", errorData);
        throw new Error(errorData.message || `Failed to fetch sessions: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Fetched sessions response:", data);

      // Handle different response formats - API might return { data: [...] } or just [...]
      const sessionsArray = Array.isArray(data) ? data : (data.data || data.sessions || []);

      if (!Array.isArray(sessionsArray)) {
        console.error("Unexpected API response format:", data);
        throw new Error("Invalid response format from API");
      }

      const restaurantSessions = sessionsArray.filter(
        (s: ChatSession) => s.restaurant_id === restaurantId
      );
      console.log(`Filtered ${restaurantSessions.length} sessions for restaurant ${restaurantId}`);
      setSessions(restaurantSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setSessionsError(error instanceof Error ? error.message : "Failed to load sessions");
      setSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const createNewSession = async (subject: string, initialMessage: string) => {
    if (!restaurantId) {
      throw new Error("Restaurant ID not loaded");
    }

    setIsCreatingSession(true);
    const token = localStorage.getItem("auth-token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:45000";

    try {
      console.log("Creating new chat session:", { subject, restaurant_id: restaurantId });

      const response = await fetch(`${apiUrl}/api/v1/chat/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject,
          category: "restaurant_support",
          priority: "medium",
          restaurant_id: restaurantId,
          initial_message: initialMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to create session - API Error:", errorData);
        throw new Error(errorData.message || `Failed to create chat session: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Session created response:", data);

      // Handle different response formats - API might return { data: {...} } or { session: {...} } or just {...}
      const session = data.data || data.session || data;

      if (!session || !session.id) {
        console.error("Invalid session response format:", data);
        throw new Error("Invalid response format from API - missing session ID");
      }

      console.log("New session created successfully:", session.id);

      // Wait for session to be fully created before proceeding
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh sessions list
      await fetchSessions();

      // Select the new session
      setSelectedSessionId(session.id);
      setSessionStatus(session.status);
    } catch (error) {
      console.error("Error creating chat session:", error);
      throw error;
    } finally {
      setIsCreatingSession(false);
    }
  };

  const connectToSocket = (sessionId: string) => {
    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const token = localStorage.getItem("auth-token");
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:45000";

    const socket = io(wsUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Connected to chat server");
      setIsConnected(true);

      // Join the session after connection is established
      socket.emit("join_session", { session_id: sessionId });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from chat server");
      setIsConnected(false);
    });

    socket.on("session_joined", (data) => {
      console.log("Joined session:", data);
      setMessages(data.messages || []);
      setSessionStatus(data.session.status);
      setIsLoadingMessages(false);
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

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsLoadingMessages(true);
    setMessages([]);

    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setSessionStatus(session.status);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || !socketRef.current || !selectedSessionId) {
      return;
    }

    // Check if connected
    if (!isConnected) {
      console.error("Not connected to chat server");
      return;
    }

    const tempId = Date.now().toString();

    socketRef.current.emit("send_message", {
      session_id: selectedSessionId,
      content: inputMessage,
      message_type: "text",
      temp_id: tempId,
    });

    setInputMessage("");

    if (socketRef.current && selectedSessionId) {
      socketRef.current.emit("stop_typing", { session_id: selectedSessionId });
    }
  };

  const handleTyping = () => {
    if (socketRef.current && selectedSessionId && isConnected) {
      socketRef.current.emit("typing", { session_id: selectedSessionId });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && selectedSessionId) {
          socketRef.current.emit("stop_typing", { session_id: selectedSessionId });
        }
      }, 3000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSessionId) return;

    const token = localStorage.getItem("auth-token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:45000";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("session_id", selectedSessionId);

    try {
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
    }
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Support Chat</h2>
          <p className="text-gray-600">
            Get help with your restaurant portal or connect with our support team
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          </div>
          <NewChatDialog
            onCreateChat={createNewSession}
            isOpen={isNewChatOpen}
            onOpenChange={setIsNewChatOpen}
            trigger={
              <Button className="gap-2" disabled={isCreatingSession || isLoadingRestaurant || !restaurantId}>
                {isCreatingSession ? (
                  <>
                    <CircularProgress size={16} className="text-current" />
                    Creating...
                  </>
                ) : (
                  <>
                    <AddIcon sx={{ fontSize: 20 }} />
                    New Chat
                  </>
                )}
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-[30%_70%] gap-6 h-[700px]">
        {/* Left Panel - Sessions List */}
        <Card className="bg-white rounded-xl shadow-sm border border-border/40 overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="border-b border-border/40 p-4">
              <h3 className="font-semibold text-lg">Conversations</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {sessions.length} {sessions.length === 1 ? "conversation" : "conversations"}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {sessionsError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <p className="text-sm text-destructive mb-4">{sessionsError}</p>
                  <Button onClick={fetchSessions} size="sm" variant="outline">
                    Retry
                  </Button>
                </div>
              ) : (
                <ChatSessionList
                  sessions={sessions}
                  selectedSessionId={selectedSessionId}
                  onSessionSelect={handleSessionSelect}
                  isLoading={isLoadingSessions}
                />
              )}
            </div>
          </div>
        </Card>

        {/* Right Panel - Chat Interface */}
        <Card className="bg-white rounded-xl shadow-sm border border-border/40 overflow-hidden">
          <div className="flex flex-col h-full">
            {selectedSessionId && selectedSession ? (
              <>
                <div className="border-b border-border/40 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {selectedSession.subject}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Status: <span className="capitalize">{sessionStatus.replace("_", " ")}</span>
                      </p>
                    </div>
                    {sessionStatus === "waiting" && (
                      <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full text-sm border border-yellow-200">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                        </span>
                        Waiting for agent
                      </div>
                    )}
                    {sessionStatus === "active" && (
                      <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm border border-green-200">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        Active
                      </div>
                    )}
                  </div>
                </div>
                {isLoadingMessages ? (
                  <div className="flex-1 flex items-center justify-center">
                    <CircularProgress size={32} className="text-muted-foreground" />
                  </div>
                ) : (
                  <ChatInterface
                    messages={messages}
                    inputMessage={inputMessage}
                    onInputChange={setInputMessage}
                    onSendMessage={handleSendMessage}
                    onFileUpload={handleFileUpload}
                    onTyping={handleTyping}
                    sessionStatus={sessionStatus}
                    isConnected={isConnected}
                    typingUser={typingUser}
                    disabled={!isConnected}
                  />
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="rounded-full bg-muted p-6 mb-6">
                  <AddIcon sx={{ fontSize: 48 }} className="text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No conversation selected</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  Select a conversation from the list or start a new one to begin chatting with our support team
                </p>
                <Button onClick={() => setIsNewChatOpen(true)} className="gap-2">
                  <AddIcon sx={{ fontSize: 20 }} />
                  Start New Conversation
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
