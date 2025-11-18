"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ChatTest() {
  const [restaurantId, setRestaurantId] = useState("");
  const { isConnected, session, messages, typingUsers, createSession, sendMessage, startTyping, stopTyping } = useChat(restaurantId);
  const [subject, setSubject] = useState("Test Support Chat");
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreateSession = async () => {
    await createSession(subject, "Hello, I need help with my restaurant account");
  };

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput);
      setMessageInput("");
    }
  };

  const handleInputChange = (value: string) => {
    setMessageInput(value);
    if (value.length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Chat Test - Restaurant Portal</span>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
              <span>{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!session ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Restaurant ID (optional)</label>
                <Input
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.target.value)}
                  placeholder="Enter restaurant ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What do you need help with?"
                />
              </div>
              <Button onClick={handleCreateSession} disabled={!isConnected}>
                Start Chat Session
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="text-sm font-medium">Session ID: {session.id}</div>
                <div className="text-sm text-gray-600">Status: {session.status}</div>
                {session.agent_id && (
                  <div className="text-sm text-green-600">Agent assigned</div>
                )}
              </div>

              <div className="border rounded-lg h-96 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_role === "restaurant" || msg.sender_role === "customer" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-xs rounded-lg p-3 ${msg.sender_role === "restaurant" || msg.sender_role === "customer" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"}`}>
                        {msg.sender_role !== "restaurant" && msg.sender_role !== "customer" && (
                          <div className="text-xs font-semibold mb-1">{msg.sender_name || msg.sender_role}</div>
                        )}
                        <div className="text-sm">{msg.content}</div>
                        <div className="text-xs mt-1 opacity-75">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {typingUsers.size > 0 && (
                    <div className="text-sm text-gray-500 italic">
                      {Array.from(typingUsers).join(", ")} is typing...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {session.status !== "closed" && (
                  <div className="border-t p-3 flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Type a message..."
                      disabled={!isConnected}
                    />
                    <Button onClick={handleSendMessage} disabled={!isConnected || !messageInput.trim()}>
                      Send
                    </Button>
                  </div>
                )}
                {session.status === "closed" && (
                  <div className="border-t p-3 text-center text-sm text-gray-600 bg-yellow-50">
                    This chat session has been closed.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
