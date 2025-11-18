"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:45000";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:45000";

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  sender_role: string;
  sender_name?: string;
  content: string;
  message_type: "text" | "image" | "file";
  created_at: string;
  attachments?: any[];
  read_by?: any[];
}

export interface ChatSession {
  id: string;
  customer_id: string;
  restaurant_id?: string;
  subject: string;
  category: string;
  status: "waiting" | "active" | "closed";
  created_at: string;
  agent_id?: string;
  unread_count?: number;
}

interface UseChatReturn {
  socket: Socket | null;
  isConnected: boolean;
  session: ChatSession | null;
  messages: ChatMessage[];
  typingUsers: Set<string>;
  createSession: (subject: string, initialMessage?: string) => Promise<ChatSession | null>;
  sendMessage: (content: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
  joinSession: (sessionId: string) => void;
  leaveSession: () => void;
}

export function useChat(restaurantId?: string): UseChatReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (!token) {
      console.error("No auth token found");
      return;
    }

    const socket = io(WS_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Restaurant connected to chat");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Restaurant disconnected from chat");
      setIsConnected(false);
    });

    socket.on("error", (error: any) => {
      console.error("Socket error:", error);
    });

    socket.on("session_joined", (data: any) => {
      console.log("Session joined:", data);
      setSession(data.session);
      setMessages(data.messages || []);
    });

    socket.on("new_message", ({ message }: any) => {
      console.log("New message received:", message);
      setMessages((prev) => [...prev, message]);
    });

    socket.on("user_typing", ({ user_id, user_name }: any) => {
      console.log("User typing:", user_name || user_id);
      setTypingUsers((prev) => new Set([...prev, user_name || user_id]));
    });

    socket.on("typing_stopped", ({ user_id, user_name }: any) => {
      console.log("Typing stopped:", user_name || user_id);
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(user_name || user_id);
        return newSet;
      });
    });

    socket.on("chat_accepted", ({ session: updatedSession, agent_name }: any) => {
      console.log("Chat accepted by:", agent_name);
      setSession(updatedSession);
    });

    socket.on("chat_closed", ({ session: updatedSession }: any) => {
      console.log("Chat closed");
      setSession(updatedSession);
    });

    socket.on("messages_read", (data: any) => {
      console.log("Messages read:", data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const createSession = async (
    subject: string,
    initialMessage?: string
  ): Promise<ChatSession | null> => {
    const token = localStorage.getItem("auth-token");
    if (!token) {
      console.error("No auth token");
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/chat/sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          category: "support",
          initial_message: initialMessage || subject,
          restaurant_id: restaurantId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create session");
      }

      const data = await response.json();
      const newSession = data.data || data.session;
      console.log("Session created:", newSession);
      setSession(newSession);

      joinSession(newSession.id);

      return newSession;
    } catch (error) {
      console.error("Error creating session:", error);
      return null;
    }
  };

  const joinSession = (sessionId: string) => {
    if (socketRef.current) {
      console.log("Joining session:", sessionId);
      socketRef.current.emit("join_session", { session_id: sessionId });
    }
  };

  const leaveSession = () => {
    if (socketRef.current && session) {
      socketRef.current.emit("leave_session", { session_id: session.id });
      setSession(null);
      setMessages([]);
    }
  };

  const sendMessage = (content: string) => {
    if (socketRef.current && session && content.trim()) {
      socketRef.current.emit("send_message", {
        session_id: session.id,
        content: content.trim(),
        message_type: "text",
        temp_id: `temp-${Date.now()}`,
      });
      stopTyping();
    }
  };

  const startTyping = () => {
    if (socketRef.current && session) {
      socketRef.current.emit("typing", { session_id: session.id });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    }
  };

  const stopTyping = () => {
    if (socketRef.current && session) {
      socketRef.current.emit("stop_typing", { session_id: session.id });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    session,
    messages,
    typingUsers,
    createSession,
    sendMessage,
    startTyping,
    stopTyping,
    joinSession,
    leaveSession,
  };
}
