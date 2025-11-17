"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useParams } from "next/navigation";
import { API_ENDPOINTS } from "@/lib/api";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
}

interface RestaurantContextType {
  restaurant: Restaurant | null;
  isLoading: boolean;
}

const RestaurantContext = createContext<RestaurantContextType>({
  restaurant: null,
  isLoading: true,
});

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const restaurantSlug = decodeURIComponent(params.slug as string);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        const response = await fetch(
          API_ENDPOINTS.restaurants.details(restaurantSlug),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setRestaurant(data.restaurant || null);
        }
      } catch (error) {
        console.error("Failed to fetch restaurant:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurant();
  }, [restaurantSlug]);

  return (
    <RestaurantContext.Provider value={{ restaurant, isLoading }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error("useRestaurant must be used within RestaurantProvider");
  }
  return context;
}
