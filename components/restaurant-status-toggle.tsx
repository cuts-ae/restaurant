"use client";

import { useState, useEffect } from "react";
import { Check, ChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";

type OperatingStatus = "open" | "not_accepting_orders" | "closed";

interface StatusConfig {
  label: string;
  dotColor: string;
}

const statusConfig: Record<OperatingStatus, StatusConfig> = {
  open: {
    label: "Open & Accepting Orders",
    dotColor: "bg-green-500",
  },
  not_accepting_orders: {
    label: "Open - Not Accepting Orders",
    dotColor: "bg-amber-500",
  },
  closed: {
    label: "Closed",
    dotColor: "bg-red-500",
  },
};

interface RestaurantStatusToggleProps {
  restaurantId: string;
  initialStatus?: OperatingStatus;
  onStatusChange?: (status: OperatingStatus) => void;
}

export function RestaurantStatusToggle({
  restaurantId,
  initialStatus = "open",
  onStatusChange,
}: RestaurantStatusToggleProps) {
  const [status, setStatus] = useState<OperatingStatus>(initialStatus);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const currentConfig = statusConfig[status];

  const updateStatus = async (newStatus: OperatingStatus) => {
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem("auth-token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:45000";
      const url = `${apiUrl}/api/v1/restaurants/${restaurantId}/operating-status`;

      console.log("Updating status to:", newStatus);
      console.log("Request URL:", url);

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ operating_status: newStatus }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response:", errorData);
        throw new Error(errorData.message || "Failed to update status");
      }

      const data = await response.json();
      console.log("Success response:", data);

      setStatus(newStatus);
      setIsOpen(false);
      onStatusChange?.(newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
      alert(`Failed to update operating status: ${error instanceof Error ? error.message : "Please try again."}`);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-status-toggle]")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" data-status-toggle>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/40 bg-white shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2">
          <div className={cn("w-2.5 h-2.5 rounded-full", currentConfig.dotColor)} />
          <span className="font-medium text-sm text-foreground">
            {currentConfig.label}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform ml-1",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[280px] bg-white rounded-lg shadow-lg border border-border/50 overflow-hidden z-50">
          {(Object.entries(statusConfig) as [OperatingStatus, StatusConfig][]).map(
            ([statusKey, config]) => (
              <button
                key={statusKey}
                onClick={() => updateStatus(statusKey)}
                disabled={isUpdating}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed",
                  status === statusKey && "bg-muted/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full", config.dotColor)} />
                  <span className="font-medium text-sm">{config.label}</span>
                </div>
                {status === statusKey && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
