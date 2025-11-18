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
    updateOperatingStatus: (id: string) => `${API_URL}/api/v1/restaurants/${id}/operating-status`,
  },
  orders: {
    list: (restaurantId: string) =>
      `${API_URL}/api/v1/orders?restaurant_id=${restaurantId}`,
    updateStatus: (orderId: string) =>
      `${API_URL}/api/v1/orders/${orderId}/status`,
  },
  menuItems: {
    create: (restaurantId: string) => `${API_URL}/api/v1/restaurants/${restaurantId}/menu-items`,
    update: (id: string) => `${API_URL}/api/v1/menu-items/${id}`,
    delete: (id: string) => `${API_URL}/api/v1/menu-items/${id}`,
    toggleAvailability: (id: string) =>
      `${API_URL}/api/v1/menu-items/${id}/availability`,
  },
  support: {
    createTicket: `${API_URL}/api/v1/support/tickets`,
    getTickets: `${API_URL}/api/v1/support/tickets`,
    getTicketById: (id: string) => `${API_URL}/api/v1/support/tickets/${id}`,
    addReply: (id: string) => `${API_URL}/api/v1/support/tickets/${id}/replies`,
  },
  invoices: {
    list: `${API_URL}/api/v1/invoices`,
    getById: (id: string) => `${API_URL}/api/v1/invoices/${id}`,
    getByRestaurant: (restaurantId: string) =>
      `${API_URL}/api/v1/invoices?restaurant_id=${restaurantId}`,
    updateStatus: (id: string) => `${API_URL}/api/v1/invoices/${id}/status`,
  },
  admin: {
    stats: `/api/admin/stats`,
    allMenuItems: `/api/admin/menu-items`,
    allSupportTickets: `/api/admin/support-tickets`,
  },
};
