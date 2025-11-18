"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function SupportCustomersPage() {
  return (
    <div className="space-y-8">
      <div className="support-page-header">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
          Customers
        </h1>
        <p className="text-muted-foreground mt-2">
          View and manage customer information
        </p>
      </div>

      <Card className="support-info-card">
        <CardHeader>
          <CardTitle className="text-xl">Customer Database</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 p-8 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-green-100 mb-4">
              <Users className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="font-bold text-green-900 mb-2 text-lg">
              Customer Management Coming Soon
            </h3>
            <p className="text-sm text-green-700 max-w-md mx-auto">
              This section will display customer information, interaction history, and comprehensive account details.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
