'use server';

import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDFTemplate } from '@/components/invoice-pdf-template';
import { createElement } from 'react';

export interface Invoice {
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
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
}

export async function generateInvoicePDF(invoice: Invoice): Promise<{
  success: boolean;
  data?: string;
  filename?: string;
  error?: string;
}> {
  try {
    // Create the PDF document using the template
    const pdfDocument = createElement(InvoicePDFTemplate, { invoice });

    // Render to buffer
    const buffer = await renderToBuffer(pdfDocument);

    // Convert buffer to base64
    const base64 = buffer.toString('base64');

    return {
      success: true,
      data: base64,
      filename: `${invoice.invoiceNumber}.pdf`,
    };
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate invoice',
    };
  }
}

export async function generateMultipleInvoicesPDF(
  invoices: Invoice[]
): Promise<{
  success: boolean;
  data?: Array<{ filename: string; data: string }>;
  error?: string;
}> {
  try {
    const results = await Promise.all(
      invoices.map(async (invoice) => {
        const result = await generateInvoicePDF(invoice);
        if (result.success && result.data && result.filename) {
          return {
            filename: result.filename,
            data: result.data,
          };
        }
        throw new Error(`Failed to generate PDF for ${invoice.invoiceNumber}`);
      })
    );

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    console.error('Error generating multiple invoices:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate invoices',
    };
  }
}
