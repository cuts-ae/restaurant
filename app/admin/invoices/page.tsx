"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  X,
  TrendingUp,
  TrendingDown,
  Building2,
} from "@/components/icons";
import { generateInvoicePDF, generateMultipleInvoicesPDF } from "./actions";

interface Invoice {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  restaurant: {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: "paid" | "pending" | "overdue" | "cancelled";
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
}

export default function AdminInvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [restaurantFilter, setRestaurantFilter] = useState<string>("all");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  // Mock data - in production this would come from an API
  const invoices: Invoice[] = [
    {
      id: "1",
      invoiceNumber: "INV-2024-001234",
      orderNumber: "ORD-2024-1234",
      customer: {
        name: "Ahmed Al Maktoum",
        email: "ahmed.almaktoum@email.ae",
        phone: "+971 50 123 4567",
        address: "DIFC, Dubai, UAE",
      },
      restaurant: {
        id: "rest-1",
        name: "The Butcher Shop",
        address: "Sheikh Zayed Road, Trade Centre, Dubai",
        phone: "+971 4 123 4567",
        email: "contact@butchershop.ae",
      },
      items: [
        { name: "Wagyu Ribeye Steak", quantity: 2, price: 180, total: 360 },
        { name: "Lamb Chops", quantity: 1, price: 90, total: 90 },
      ],
      subtotal: 450,
      tax: 22.5,
      total: 472.5,
      status: "paid",
      issueDate: "2024-11-17",
      dueDate: "2024-11-24",
      paidDate: "2024-11-17",
      paymentMethod: "Credit Card",
    },
    {
      id: "2",
      invoiceNumber: "INV-2024-001235",
      orderNumber: "ORD-2024-1235",
      customer: {
        name: "Fatima Hassan",
        email: "fatima.hassan@email.ae",
        phone: "+971 55 987 6543",
        address: "Dubai Marina, Dubai, UAE",
      },
      restaurant: {
        id: "rest-2",
        name: "Prime Cuts",
        address: "Marina Walk, Dubai Marina, Dubai",
        phone: "+971 4 987 6543",
        email: "info@primecuts.ae",
      },
      items: [
        { name: "Beef Tenderloin", quantity: 1, price: 220, total: 220 },
        { name: "Grilled Vegetables", quantity: 2, price: 50, total: 100 },
      ],
      subtotal: 320,
      tax: 16,
      total: 336,
      status: "pending",
      issueDate: "2024-11-16",
      dueDate: "2024-11-23",
      paymentMethod: "Cash on Delivery",
    },
    {
      id: "3",
      invoiceNumber: "INV-2024-001236",
      orderNumber: "ORD-2024-1236",
      customer: {
        name: "Mohammed Khan",
        email: "mohammed.khan@email.ae",
        phone: "+971 52 456 7890",
        address: "Jumeirah, Dubai, UAE",
      },
      restaurant: {
        id: "rest-3",
        name: "Grill House",
        address: "Al Wasl Road, Jumeirah, Dubai",
        phone: "+971 4 456 7890",
        email: "hello@grillhouse.ae",
      },
      items: [
        { name: "Mixed Grill Platter", quantity: 3, price: 150, total: 450 },
        { name: "Caesar Salad", quantity: 2, price: 40, total: 80 },
      ],
      subtotal: 530,
      tax: 26.5,
      total: 556.5,
      status: "paid",
      issueDate: "2024-11-15",
      dueDate: "2024-11-22",
      paidDate: "2024-11-15",
      paymentMethod: "Credit Card",
    },
    {
      id: "4",
      invoiceNumber: "INV-2024-001237",
      orderNumber: "ORD-2024-1237",
      customer: {
        name: "Aisha Patel",
        email: "aisha.patel@email.ae",
        phone: "+971 56 234 5678",
        address: "Business Bay, Dubai, UAE",
      },
      restaurant: {
        id: "rest-1",
        name: "The Butcher Shop",
        address: "Sheikh Zayed Road, Trade Centre, Dubai",
        phone: "+971 4 123 4567",
        email: "contact@butchershop.ae",
      },
      items: [
        { name: "Chicken Breast", quantity: 4, price: 60, total: 240 },
        { name: "Soup of the Day", quantity: 2, price: 15, total: 30 },
      ],
      subtotal: 270,
      tax: 13.5,
      total: 283.5,
      status: "pending",
      issueDate: "2024-11-14",
      dueDate: "2024-11-21",
      paymentMethod: "Apple Pay",
    },
    {
      id: "5",
      invoiceNumber: "INV-2024-001238",
      orderNumber: "ORD-2024-1238",
      customer: {
        name: "Omar Abdullah",
        email: "omar.abdullah@email.ae",
        phone: "+971 50 876 5432",
        address: "Downtown Dubai, Dubai, UAE",
      },
      restaurant: {
        id: "rest-2",
        name: "Prime Cuts",
        address: "Marina Walk, Dubai Marina, Dubai",
        phone: "+971 4 987 6543",
        email: "info@primecuts.ae",
      },
      items: [
        { name: "T-Bone Steak", quantity: 2, price: 160, total: 320 },
        { name: "Mashed Potatoes", quantity: 2, price: 50, total: 100 },
      ],
      subtotal: 420,
      tax: 21,
      total: 441,
      status: "paid",
      issueDate: "2024-11-13",
      dueDate: "2024-11-20",
      paidDate: "2024-11-13",
      paymentMethod: "Credit Card",
    },
    {
      id: "6",
      invoiceNumber: "INV-2024-001239",
      orderNumber: "ORD-2024-1239",
      customer: {
        name: "Mariam Al Zaabi",
        email: "mariam.alzaabi@email.ae",
        phone: "+971 55 345 6789",
        address: "Palm Jumeirah, Dubai, UAE",
      },
      restaurant: {
        id: "rest-3",
        name: "Grill House",
        address: "Al Wasl Road, Jumeirah, Dubai",
        phone: "+971 4 456 7890",
        email: "hello@grillhouse.ae",
      },
      items: [
        { name: "Lamb Biryani", quantity: 2, price: 120, total: 240 },
        { name: "Garlic Naan", quantity: 4, price: 20, total: 80 },
      ],
      subtotal: 320,
      tax: 16,
      total: 336,
      status: "overdue",
      issueDate: "2024-11-05",
      dueDate: "2024-11-12",
      paymentMethod: "Cash on Delivery",
    },
    {
      id: "7",
      invoiceNumber: "INV-2024-001240",
      orderNumber: "ORD-2024-1240",
      customer: {
        name: "Yusuf Rahman",
        email: "yusuf.rahman@email.ae",
        phone: "+971 52 111 2222",
        address: "Arabian Ranches, Dubai, UAE",
      },
      restaurant: {
        id: "rest-1",
        name: "The Butcher Shop",
        address: "Sheikh Zayed Road, Trade Centre, Dubai",
        phone: "+971 4 123 4567",
        email: "contact@butchershop.ae",
      },
      items: [
        { name: "Porterhouse Steak", quantity: 1, price: 280, total: 280 },
        { name: "Truffle Fries", quantity: 1, price: 65, total: 65 },
      ],
      subtotal: 345,
      tax: 17.25,
      total: 362.25,
      status: "paid",
      issueDate: "2024-11-12",
      dueDate: "2024-11-19",
      paidDate: "2024-11-12",
      paymentMethod: "Credit Card",
    },
    {
      id: "8",
      invoiceNumber: "INV-2024-001241",
      orderNumber: "ORD-2024-1241",
      customer: {
        name: "Layla Ahmed",
        email: "layla.ahmed@email.ae",
        phone: "+971 55 333 4444",
        address: "JBR, Dubai, UAE",
      },
      restaurant: {
        id: "rest-2",
        name: "Prime Cuts",
        address: "Marina Walk, Dubai Marina, Dubai",
        phone: "+971 4 987 6543",
        email: "info@primecuts.ae",
      },
      items: [
        { name: "Seafood Paella", quantity: 2, price: 145, total: 290 },
        { name: "Sangria", quantity: 1, price: 45, total: 45 },
      ],
      subtotal: 335,
      tax: 16.75,
      total: 351.75,
      status: "cancelled",
      issueDate: "2024-11-11",
      dueDate: "2024-11-18",
      paymentMethod: "Credit Card",
    },
    {
      id: "9",
      invoiceNumber: "INV-2024-001242",
      orderNumber: "ORD-2024-1242",
      customer: {
        name: "Hassan Ali",
        email: "hassan.ali@email.ae",
        phone: "+971 50 555 6666",
        address: "Al Barsha, Dubai, UAE",
      },
      restaurant: {
        id: "rest-3",
        name: "Grill House",
        address: "Al Wasl Road, Jumeirah, Dubai",
        phone: "+971 4 456 7890",
        email: "hello@grillhouse.ae",
      },
      items: [
        { name: "BBQ Ribs", quantity: 3, price: 95, total: 285 },
        { name: "Coleslaw", quantity: 3, price: 25, total: 75 },
      ],
      subtotal: 360,
      tax: 18,
      total: 378,
      status: "overdue",
      issueDate: "2024-11-08",
      dueDate: "2024-11-15",
      paymentMethod: "Cash on Delivery",
    },
    {
      id: "10",
      invoiceNumber: "INV-2024-001243",
      orderNumber: "ORD-2024-1243",
      customer: {
        name: "Sara Ibrahim",
        email: "sara.ibrahim@email.ae",
        phone: "+971 56 777 8888",
        address: "Motor City, Dubai, UAE",
      },
      restaurant: {
        id: "rest-1",
        name: "The Butcher Shop",
        address: "Sheikh Zayed Road, Trade Centre, Dubai",
        phone: "+971 4 123 4567",
        email: "contact@butchershop.ae",
      },
      items: [
        { name: "Filet Mignon", quantity: 2, price: 195, total: 390 },
        { name: "Asparagus", quantity: 2, price: 45, total: 90 },
      ],
      subtotal: 480,
      tax: 24,
      total: 504,
      status: "pending",
      issueDate: "2024-11-10",
      dueDate: "2024-11-17",
      paymentMethod: "Apple Pay",
    },
  ];

  // Extract unique restaurants for filter
  const restaurants = useMemo(() => {
    const uniqueRestaurants = Array.from(
      new Map(
        invoices.map((inv) => [inv.restaurant.id, inv.restaurant])
      ).values()
    );
    return uniqueRestaurants;
  }, []);

  // Apply all filters
  const filteredInvoices = useMemo(() => {
    const filtered = invoices.filter((invoice) => {
      // Search filter
      const matchesSearch =
        invoice.invoiceNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        invoice.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.restaurant.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        invoice.customer.email.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "all" || invoice.status === statusFilter;

      // Restaurant filter
      const matchesRestaurant =
        restaurantFilter === "all" ||
        invoice.restaurant.id === restaurantFilter;

      // Date range filter
      const invoiceDate = new Date(invoice.issueDate);
      const matchesDateStart = dateRangeStart
        ? invoiceDate >= new Date(dateRangeStart)
        : true;
      const matchesDateEnd = dateRangeEnd
        ? invoiceDate <= new Date(dateRangeEnd)
        : true;

      // Amount range filter
      const matchesMinAmount = minAmount
        ? invoice.total >= parseFloat(minAmount)
        : true;
      const matchesMaxAmount = maxAmount
        ? invoice.total <= parseFloat(maxAmount)
        : true;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesRestaurant &&
        matchesDateStart &&
        matchesDateEnd &&
        matchesMinAmount &&
        matchesMaxAmount
      );
    });

    // Sort results
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.issueDate).getTime();
        const dateB = new Date(b.issueDate).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      } else {
        return sortOrder === "desc"
          ? b.total - a.total
          : a.total - b.total;
      }
    });

    return filtered;
  }, [
    invoices,
    searchQuery,
    statusFilter,
    restaurantFilter,
    dateRangeStart,
    dateRangeEnd,
    minAmount,
    maxAmount,
    sortBy,
    sortOrder,
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "overdue":
        return "bg-red-100 text-red-700 border-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle size={16} />;
      case "pending":
        return <Clock size={16} />;
      case "overdue":
        return <XCircle size={16} />;
      case "cancelled":
        return <XCircle size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const allInvoices = invoices;
    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidRevenue = filteredInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.total, 0);
    const pendingRevenue = filteredInvoices
      .filter((inv) => inv.status === "pending")
      .reduce((sum, inv) => sum + inv.total, 0);
    const overdueRevenue = filteredInvoices
      .filter((inv) => inv.status === "overdue")
      .reduce((sum, inv) => sum + inv.total, 0);

    return {
      all: {
        count: allInvoices.length,
        revenue: allInvoices.reduce((sum, inv) => sum + inv.total, 0),
      },
      filtered: {
        count: filteredInvoices.length,
        revenue: totalRevenue,
      },
      paid: {
        count: filteredInvoices.filter((i) => i.status === "paid").length,
        revenue: paidRevenue,
      },
      pending: {
        count: filteredInvoices.filter((i) => i.status === "pending").length,
        revenue: pendingRevenue,
      },
      overdue: {
        count: filteredInvoices.filter((i) => i.status === "overdue").length,
        revenue: overdueRevenue,
      },
      cancelled: {
        count: filteredInvoices.filter((i) => i.status === "cancelled").length,
      },
    };
  }, [invoices, filteredInvoices]);

  const downloadPDF = async (invoice: Invoice) => {
    try {
      setDownloadingId(invoice.id);
      const result = await generateInvoicePDF(invoice);

      if (result.success && result.data && result.filename) {
        const blob = new Blob([Buffer.from(result.data, "base64")], {
          type: "application/pdf",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert(result.error || "Failed to generate invoice PDF");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download invoice PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const downloadAllPDFs = async () => {
    try {
      setDownloadingAll(true);
      const result = await generateMultipleInvoicesPDF(filteredInvoices);

      if (result.success && result.data) {
        for (const { filename, data } of result.data) {
          const blob = new Blob([Buffer.from(data, "base64")], {
            type: "application/pdf",
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } else {
        alert(result.error || "Failed to generate invoices");
      }
    } catch (error) {
      console.error("Error downloading all PDFs:", error);
      alert("Failed to download invoices");
    } finally {
      setDownloadingAll(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setRestaurantFilter("all");
    setDateRangeStart("");
    setDateRangeEnd("");
    setMinAmount("");
    setMaxAmount("");
  };

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== "all" ||
    restaurantFilter !== "all" ||
    dateRangeStart ||
    dateRangeEnd ||
    minAmount ||
    maxAmount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Invoices</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive invoice management across all restaurants
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={downloadAllPDFs}
          disabled={downloadingAll || filteredInvoices.length === 0}
        >
          <Download size={16} />
          {downloadingAll
            ? "Downloading..."
            : `Download Filtered (${filteredInvoices.length})`}
        </Button>
      </div>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              AED {stats.filtered.revenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.filtered.count} invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              AED {stats.paid.revenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.paid.count} invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              AED {stats.pending.revenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pending.count} invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              AED {stats.overdue.revenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.overdue.count} invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats.cancelled.count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter size={20} />
              Advanced Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                <X size={16} />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Status Row */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search by invoice, order, customer, or restaurant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Restaurant and Date Range Row */}
          <div className="flex gap-4">
            <Select value={restaurantFilter} onValueChange={setRestaurantFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Filter by restaurant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Restaurants</SelectItem>
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="text-muted-foreground" size={16} />
              <Input
                type="date"
                placeholder="Start date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="flex-1"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                placeholder="End date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Amount Range and Sort Row */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 flex-1">
              <DollarSign className="text-muted-foreground" size={16} />
              <Input
                type="number"
                placeholder="Min amount (AED)"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="flex-1"
                min="0"
                step="0.01"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max amount (AED)"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="flex-1"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "amount")}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="amount">Sort by Amount</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "desc" ? (
                  <TrendingDown size={16} />
                ) : (
                  <TrendingUp size={16} />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter size={16} />
          Showing {filteredInvoices.length} of {invoices.length} invoices
        </div>
      )}

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.map((invoice) => (
          <Card key={invoice.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">
                      {invoice.invoiceNumber}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={getStatusColor(invoice.status)}
                    >
                      <div className="flex items-center gap-1">
                        {getStatusIcon(invoice.status)}
                        <span className="capitalize">{invoice.status}</span>
                      </div>
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Building2 size={12} />
                      {invoice.restaurant.name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText size={16} />
                      {invoice.orderNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={16} />
                      Issued: {new Date(invoice.issueDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={16} />
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </span>
                    {invoice.paidDate && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle size={16} />
                        Paid: {new Date(invoice.paidDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-2xl font-bold">
                    <DollarSign size={20} />
                    <span>AED {invoice.total.toFixed(2)}</span>
                  </div>
                  {invoice.paymentMethod && (
                    <p className="text-sm text-muted-foreground">
                      {invoice.paymentMethod}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                    Customer
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{invoice.customer.name}</p>
                    <p className="text-muted-foreground">
                      {invoice.customer.email}
                    </p>
                    <p className="text-muted-foreground">
                      {invoice.customer.phone}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {invoice.customer.address}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                    Restaurant
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{invoice.restaurant.name}</p>
                    <p className="text-muted-foreground">
                      {invoice.restaurant.phone}
                    </p>
                    <p className="text-muted-foreground">
                      {invoice.restaurant.email}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {invoice.restaurant.address}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                    Items & Breakdown
                  </h4>
                  <div className="space-y-1 text-sm">
                    {invoice.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-muted-foreground">
                          AED {item.total.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 border-t space-y-1">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>AED {invoice.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tax (5%)</span>
                        <span>AED {invoice.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-1 border-t">
                        <span>Total</span>
                        <span>AED {invoice.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => downloadPDF(invoice)}
                  disabled={downloadingId === invoice.id}
                >
                  <Download size={16} />
                  {downloadingId === invoice.id ? "Generating..." : "Download PDF"}
                </Button>
                <Button variant="outline">View Details</Button>
                {invoice.status === "pending" && (
                  <Button variant="default">Mark as Paid</Button>
                )}
                {invoice.status === "overdue" && (
                  <Button variant="destructive">Send Reminder</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInvoices.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No invoices found</p>
            <p className="text-muted-foreground mb-4">
              No invoices match your current filter criteria
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
