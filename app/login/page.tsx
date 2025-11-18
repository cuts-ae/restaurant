"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { API_ENDPOINTS } from "@/lib/api";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      window.location.replace("/dashboard");
    }
  }, []);

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

      localStorage.setItem("auth-token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      const maxAge = 7 * 24 * 60 * 60;
      document.cookie = `auth-token=${data.token}; path=/; max-age=${maxAge}`;

      setSuccess(true);

      // Role-based routing
      const redirectMap: Record<string, string> = {
        admin: "/admin/dashboard",
        restaurant_owner: "/dashboard",
        support: "/support/dashboard",
      };

      const redirectPath = redirectMap[data.user.role] || "/dashboard";

      setTimeout(() => {
        window.location.replace(redirectPath);
      }, 500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid credentials. Please try again.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.03),transparent_50%)] pointer-events-none" />

      <Card className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md backdrop-blur-sm bg-card/50 border-border/50 shadow-2xl animate-in fade-in slide-in-from-left duration-700">
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
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="owner@cuts.ae"
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
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <VisibilityOffIcon sx={{ fontSize: 24 }} />
                    ) : (
                      <VisibilityIcon sx={{ fontSize: 24 }} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-md bg-green-50 border border-green-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-green-700">
                  Login successful! Redirecting...
                </p>
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

      <div className="absolute top-1/2 left-1/2 -translate-y-1/2 translate-x-[calc(50%+1.5rem)] w-[450px] animate-in fade-in slide-in-from-right duration-700 hidden lg:block">
        <div className="relative backdrop-blur-sm bg-card/30 border-2 border-dashed border-border/60 rounded-xl p-6 shadow-lg">
          <div className="absolute -top-3 left-4 bg-background px-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Demo Credentials
            </span>
          </div>

          <div className="space-y-4 mt-2">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="space-y-3 flex-1">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  For development and testing purposes, use these credentials:
                </p>

                <div className="space-y-3 bg-muted/30 rounded-lg p-4 border border-border/40">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Email
                      </span>
                    </div>
                    <code className="block text-sm font-mono bg-background/80 px-3 py-2 rounded border border-border/50 text-foreground">
                      owner1@cuts.ae
                    </code>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Password
                      </span>
                    </div>
                    <code className="block text-sm font-mono bg-background/80 px-3 py-2 rounded border border-border/50 text-foreground">
                      password123
                    </code>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2">
                  <svg
                    className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    These credentials are for demo purposes only and should not
                    be used in production.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
