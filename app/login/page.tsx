"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { API_ENDPOINTS } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.auth.login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store token in both localStorage and cookie
      localStorage.setItem("auth-token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Set cookie for middleware authentication
      document.cookie = `auth-token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days

      // Show success message
      setSuccess(true);

      // Redirect to dashboard after brief delay
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.03),transparent_50%)] pointer-events-none" />

      <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/50 border-border/50 shadow-2xl animate-in fade-in duration-500">
        <CardHeader className="space-y-4 pb-8">
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <img
                src="/logo.png"
                alt="Restaurant Logo"
                className="w-20 h-20 object-contain"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">
                Restaurant Portal
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in to manage your restaurant operations
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-md bg-green-50 border border-green-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-green-700">Login successful! Redirecting...</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || success}
              className="w-full h-12 text-base font-medium"
            >
              {success ? "Success!" : isLoading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Forgot your password?
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
