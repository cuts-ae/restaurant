// API configuration for production deployment
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:45000";

export const API_ENDPOINTS = {
  auth: {
    login: `${API_URL}/api/v1/auth/login`,
  },
  restaurants: {
    myRestaurants: `${API_URL}/api/v1/restaurants/my/restaurants`,
    details: (id: string) => `${API_URL}/api/v1/restaurants/${id}`,
    menuItems: (id: string) => `${API_URL}/api/v1/restaurants/${id}/menu-items`,
    analytics: (id: string) => `${API_URL}/api/v1/restaurants/${id}/analytics`,
  },
  orders: {
    list: (restaurantId: string) =>
      `${API_URL}/api/v1/orders?restaurant_id=${restaurantId}`,
    updateStatus: (orderId: string) =>
      `${API_URL}/api/v1/orders/${orderId}/status`,
  },
  menuItems: {
    update: (id: string) => `${API_URL}/api/v1/menu-items/${id}`,
    delete: (id: string) => `${API_URL}/api/v1/menu-items/${id}`,
    toggleAvailability: (id: string) =>
      `${API_URL}/api/v1/menu-items/${id}/availability`,
  },
};
