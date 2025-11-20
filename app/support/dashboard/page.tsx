"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, CheckCircle, Clock } from "@/components/icons";

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
      color: "text-gray-700",
      bgColor: "bg-gray-100",
      description: "Active support tickets",
    },
    {
      title: "Total Customers",
      value: "48",
      icon: Users,
      color: "text-gray-700",
      bgColor: "bg-gray-100",
      description: "Registered customers",
    },
    {
      title: "Resolved Today",
      value: "7",
      icon: CheckCircle,
      color: "text-gray-700",
      bgColor: "bg-gray-100",
      description: "Tickets resolved",
    },
    {
      title: "Avg Response Time",
      value: "2.5h",
      icon: Clock,
      color: "text-gray-700",
      bgColor: "bg-gray-100",
      description: "Average time to respond",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="support-page-header">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Welcome back, {userName}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Overview of your support activities
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-md`}>
                  <Icon className={stat.color} size={16} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="support-info-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Support Portal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="support-info-box support-info-box-blue">
            <div className="flex items-start gap-3">
              <div className="support-info-icon-wrapper support-info-icon-blue">
                <MessageSquare className="text-gray-700" size={16} />
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-900">
                  Support Portal Active
                </h3>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  You have access to the support portal. Use the navigation menu
                  to access tickets, customer information, and reports.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <h3 className="font-medium text-sm text-gray-900">Quick Actions</h3>
            <ul className="space-y-1.5 text-sm text-gray-600">
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
                <Clock className="text-gray-700" size={16} />
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-900">
                  Note: Demo Environment
                </h3>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
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
