"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function SupportReportsPage() {
  return (
    <div className="space-y-8">
      <div className="support-page-header">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
          Reports
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate and view support analytics reports
        </p>
      </div>

      <Card className="support-info-card">
        <CardHeader>
          <CardTitle className="text-xl">Support Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 p-8 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-purple-100 mb-4">
              <FileText className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="font-bold text-purple-900 mb-2 text-lg">
              Reports Coming Soon
            </h3>
            <p className="text-sm text-purple-700 max-w-md mx-auto">
              This section will display comprehensive support analytics, performance metrics, and detailed reports.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
