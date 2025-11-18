"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { generateInvoicePDF, type Invoice } from "../actions";

export default function GenerateInvoicePage() {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const [invoiceData, setInvoiceData] = useState<Invoice>({
    id: "custom",
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, "0")}`,
    orderNumber: `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
    customer: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
    restaurant: {
      name: "",
      address: "",
      phone: "",
      email: "",
    },
    items: [
      {
        name: "",
        quantity: 1,
        price: 0,
        total: 0,
      },
    ],
    subtotal: 0,
    tax: 0,
    total: 0,
    status: "pending",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    paymentMethod: "",
  });

  const calculateTotals = (items: typeof invoiceData.items) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const updateItem = (
    index: number,
    field: keyof Invoice["items"][0],
    value: string | number
  ) => {
    const newItems = [...invoiceData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "quantity" || field === "price") {
      newItems[index].total =
        newItems[index].quantity * newItems[index].price;
    }

    const { subtotal, tax, total } = calculateTotals(newItems);
    setInvoiceData({
      ...invoiceData,
      items: newItems,
      subtotal,
      tax,
      total,
    });
  };

  const addItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [
        ...invoiceData.items,
        { name: "", quantity: 1, price: 0, total: 0 },
      ],
    });
  };

  const removeItem = (index: number) => {
    const newItems = invoiceData.items.filter((_, i) => i !== index);
    const { subtotal, tax, total } = calculateTotals(newItems);
    setInvoiceData({
      ...invoiceData,
      items: newItems,
      subtotal,
      tax,
      total,
    });
  };

  const downloadPDF = async () => {
    try {
      setDownloadingPdf(true);
      const result = await generateInvoicePDF(invoiceData);

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
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Generate Custom Invoice
            </h1>
            <p className="text-muted-foreground mt-2">
              Create a customized invoice with live preview
            </p>
          </div>
        </div>
        <Button
          className="gap-2"
          onClick={downloadPDF}
          disabled={downloadingPdf}
        >
          <Download className="h-4 w-4" />
          {downloadingPdf ? "Generating PDF..." : "Download PDF"}
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-4">
          <Card className="shadow-lg">
            <CardHeader className="border-b bg-black text-white">
              <div className="space-y-2">
                <h2 className="text-4xl font-bold">INVOICE</h2>
                <p className="text-sm text-gray-300">
                  {invoiceData.invoiceNumber}
                </p>
                <div className="inline-block px-3 py-1 text-xs font-semibold rounded bg-yellow-400 text-black">
                  {invoiceData.status.toUpperCase()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Bill To
                  </h3>
                  <div className="space-y-1">
                    <p className="font-bold text-lg">
                      {invoiceData.customer.name || "Customer Name"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {invoiceData.customer.email || "customer@email.com"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {invoiceData.customer.phone || "+971 XX XXX XXXX"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {invoiceData.customer.address || "Customer Address"}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    From
                  </h3>
                  <div className="space-y-1">
                    <p className="font-bold text-lg">
                      {invoiceData.restaurant.name || "Restaurant Name"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {invoiceData.restaurant.address || "Restaurant Address"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {invoiceData.restaurant.phone || "+971 XX XXX XXXX"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {invoiceData.restaurant.email || "restaurant@email.ae"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Number:</span>
                  <span className="font-semibold">
                    {invoiceData.orderNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Issue Date:</span>
                  <span className="font-semibold">
                    {new Date(invoiceData.issueDate).toLocaleDateString(
                      "en-AE",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date:</span>
                  <span className="font-semibold">
                    {new Date(invoiceData.dueDate).toLocaleDateString("en-AE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {invoiceData.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Method:</span>
                    <span className="font-semibold">
                      {invoiceData.paymentMethod}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-black text-white px-4 py-3 grid grid-cols-12 gap-4 text-xs font-bold uppercase tracking-wider">
                  <div className="col-span-6">Item Description</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                {invoiceData.items.map((item, index) => (
                  <div
                    key={index}
                    className={`px-4 py-3 grid grid-cols-12 gap-4 text-sm border-b ${
                      index % 2 === 0 ? "bg-gray-50" : ""
                    }`}
                  >
                    <div className="col-span-6">{item.name || "Item name"}</div>
                    <div className="col-span-2 text-center">{item.quantity}</div>
                    <div className="col-span-2 text-right">
                      AED {item.price.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-right font-semibold">
                      AED {item.total.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 pt-6 space-y-3">
                <div className="flex justify-end">
                  <div className="w-80 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal:</span>
                      <span>AED {invoiceData.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tax (5%):</span>
                      <span>AED {invoiceData.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total Amount:</span>
                      <span>AED {invoiceData.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 text-center text-sm text-gray-500">
                <p>Thank you for your business!</p>
                <p className="mt-2">
                  This invoice was generated automatically. For questions,
                  please contact{" "}
                  {invoiceData.restaurant.email || "restaurant@email.ae"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Invoice Number</Label>
                <Input
                  value={invoiceData.invoiceNumber}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      invoiceNumber: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Order Number</Label>
                <Input
                  value={invoiceData.orderNumber}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      orderNumber: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <select
                  value={invoiceData.status}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      status: e.target.value as Invoice["status"],
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Issue Date</Label>
                <Input
                  type="date"
                  value={invoiceData.issueDate}
                  onChange={(e) =>
                    setInvoiceData({ ...invoiceData, issueDate: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Due Date</Label>
                <Input
                  type="date"
                  value={invoiceData.dueDate}
                  onChange={(e) =>
                    setInvoiceData({ ...invoiceData, dueDate: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Payment Method</Label>
                <Input
                  value={invoiceData.paymentMethod}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      paymentMethod: e.target.value,
                    })
                  }
                  placeholder="e.g., Credit Card"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Customer Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  value={invoiceData.customer.name}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      customer: { ...invoiceData.customer, name: e.target.value },
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  value={invoiceData.customer.email}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      customer: { ...invoiceData.customer, email: e.target.value },
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input
                  value={invoiceData.customer.phone}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      customer: { ...invoiceData.customer, phone: e.target.value },
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Address</Label>
                <Input
                  value={invoiceData.customer.address}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      customer: {
                        ...invoiceData.customer,
                        address: e.target.value,
                      },
                    })
                  }
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Restaurant Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  value={invoiceData.restaurant.name}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      restaurant: {
                        ...invoiceData.restaurant,
                        name: e.target.value,
                      },
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Address</Label>
                <Input
                  value={invoiceData.restaurant.address}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      restaurant: {
                        ...invoiceData.restaurant,
                        address: e.target.value,
                      },
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input
                  value={invoiceData.restaurant.phone}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      restaurant: {
                        ...invoiceData.restaurant,
                        phone: e.target.value,
                      },
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  value={invoiceData.restaurant.email}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      restaurant: {
                        ...invoiceData.restaurant,
                        email: e.target.value,
                      },
                    })
                  }
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                Items
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-3 w-3" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {invoiceData.items.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Item {index + 1}</span>
                    {invoiceData.items.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(index, "name", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", parseInt(e.target.value) || 1)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(index, "price", parseFloat(e.target.value) || 0)
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-right font-semibold">
                    Total: AED {item.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
