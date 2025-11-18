import { NextResponse } from "next/server";

// This would normally connect to your actual database
// For now, returning mock data that matches the dashboard structure

export async function GET() {
  try {
    const stats = {
      overview: {
        totalRevenue: 489650,
        revenueChange: 12.5,
        totalOrders: 2847,
        ordersChange: 8.3,
        totalRestaurants: 12,
        activeRestaurants: 11,
        totalUsers: 8547,
        usersChange: 15.2,
        totalMenuItems: 248,
        availableItems: 231,
      },
      orders: {
        pending: 23,
        preparing: 45,
        ready: 12,
        completed: 2689,
        cancelled: 78,
      },
      revenue: {
        today: 12450,
        thisWeek: 87230,
        thisMonth: 342890,
        allTime: 489650,
      },
      users: {
        customers: 8245,
        restaurantOwners: 12,
        admins: 3,
        activeToday: 324,
      },
      restaurants: {
        active: 11,
        inactive: 1,
        pending: 2,
        topPerforming: [
          {
            id: "1",
            name: "The Butcher Shop",
            revenue: 125430,
            orders: 456,
            rating: 4.8,
          },
          {
            id: "2",
            name: "Prime Cuts",
            revenue: 98750,
            orders: 389,
            rating: 4.6,
          },
          {
            id: "3",
            name: "Grill House",
            revenue: 87650,
            orders: 345,
            rating: 4.9,
          },
        ],
      },
      supportTickets: {
        open: 8,
        inProgress: 15,
        resolved: 234,
        total: 257,
      },
      recentActivity: [
        {
          id: "1",
          type: "order",
          description: "New order ORD-1245 from Ahmed Al Maktoum - AED 450",
          timestamp: "2 min ago",
        },
        {
          id: "2",
          type: "user",
          description: "New customer registration: Sara Malik",
          timestamp: "5 min ago",
        },
        {
          id: "3",
          type: "restaurant",
          description: "The Butcher Shop updated menu items",
          timestamp: "12 min ago",
        },
        {
          id: "4",
          type: "ticket",
          description: "Support ticket #156 resolved",
          timestamp: "15 min ago",
        },
        {
          id: "5",
          type: "order",
          description: "Order ORD-1244 completed - AED 320",
          timestamp: "18 min ago",
        },
      ],
      topMenuItems: [
        {
          id: "1",
          name: "Wagyu Ribeye Steak",
          restaurant: "The Butcher Shop",
          ordersCount: 234,
          revenue: 42120,
        },
        {
          id: "2",
          name: "Mixed Grill Platter",
          restaurant: "Grill House",
          ordersCount: 198,
          revenue: 29700,
        },
        {
          id: "3",
          name: "Beef Tenderloin",
          restaurant: "Prime Cuts",
          ordersCount: 176,
          revenue: 38720,
        },
        {
          id: "4",
          name: "Lamb Chops",
          restaurant: "The Butcher Shop",
          ordersCount: 165,
          revenue: 14850,
        },
        {
          id: "5",
          name: "T-Bone Steak",
          restaurant: "Prime Cuts",
          ordersCount: 143,
          revenue: 22880,
        },
      ],
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin statistics" },
      { status: 500 }
    );
  }
}
