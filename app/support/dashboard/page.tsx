"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, CheckCircle, Clock } from "lucide-react";

export default function SupportDashboardPage() {
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        setUserName(userData.name || userData.email || "Support Agent");
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
  }, []);

  const stats = [
    {
      title: "Open Tickets",
      value: "12",
      icon: MessageSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      description: "Active support tickets",
    },
    {
      title: "Total Customers",
      value: "48",
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-50",
      description: "Registered customers",
    },
    {
      title: "Resolved Today",
      value: "7",
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
      description: "Tickets resolved",
    },
    {
      title: "Avg Response Time",
      value: "2.5h",
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
      description: "Average time to respond",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="support-page-header">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
          Welcome back, {userName}
        </h1>
        <p className="text-muted-foreground mt-2">
          Here&apos;s an overview of your support activities
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="support-stat-card"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2.5 rounded-xl shadow-sm`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="support-info-card">
        <CardHeader>
          <CardTitle className="text-xl">Support Portal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="support-info-box support-info-box-blue">
            <div className="flex items-start gap-3">
              <div className="support-info-icon-wrapper support-info-icon-blue">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">
                  Support Portal Active
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  You have access to the support portal. Use the navigation menu
                  to access tickets, customer information, and reports.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Quick Actions</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="support-quick-action">
                <div className="support-quick-action-dot" />
                <span>View and respond to customer tickets</span>
              </li>
              <li className="support-quick-action">
                <div className="support-quick-action-dot" />
                <span>Access customer information and history</span>
              </li>
              <li className="support-quick-action">
                <div className="support-quick-action-dot" />
                <span>Generate support reports and analytics</span>
              </li>
            </ul>
          </div>

          <div className="support-info-box support-info-box-amber">
            <div className="flex items-start gap-3">
              <div className="support-info-icon-wrapper support-info-icon-amber">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">
                  Note: Demo Environment
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  This is a demonstration support portal. In production, this
                  would connect to your ticket management system and customer
                  database.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
