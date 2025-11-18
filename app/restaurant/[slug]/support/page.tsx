"use client";

import { SupportChat } from "@/components/support-chat";

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Support</h2>
        <p className="text-gray-600">
          Get help with your restaurant portal or connect with our support team
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border/40 p-8 text-center">
        <SupportChat />
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold mb-4">Need Help?</h3>
          <p className="text-gray-600 mb-6">
            Click the support button to view your existing conversations or start a new one.
            Our team is here to help you with any questions or issues.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">Quick Response</h4>
              <p className="text-sm text-muted-foreground">
                We typically respond within a few hours
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">Track Tickets</h4>
              <p className="text-sm text-muted-foreground">
                View all your conversations in one place
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">Expert Help</h4>
              <p className="text-sm text-muted-foreground">
                Get assistance from our dedicated support team
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
