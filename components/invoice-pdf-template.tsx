import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register fonts (optional - for better typography)
// Font.register({
//   family: 'Inter',
//   src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
// });

// Create styles inspired by Next.js/Vercel design
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #000000',
    paddingBottom: 20,
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000000',
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 5,
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  column: {
    width: '48%',
  },
  label: {
    fontSize: 9,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 10,
    marginBottom: 3,
    color: '#000000',
  },
  textBold: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#000000',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    padding: 8,
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e5e5',
    padding: 8,
    minHeight: 35,
  },
  tableRowEven: {
    backgroundColor: '#fafafa',
  },
  tableCol1: {
    width: '50%',
  },
  tableCol2: {
    width: '15%',
    textAlign: 'center',
  },
  tableCol3: {
    width: '17.5%',
    textAlign: 'right',
  },
  tableCol4: {
    width: '17.5%',
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTop: '2px solid #e5e5e5',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
    paddingRight: 8,
  },
  totalLabel: {
    width: '150px',
    fontSize: 10,
    color: '#666666',
    textAlign: 'right',
    marginRight: 20,
  },
  totalValue: {
    width: '100px',
    fontSize: 10,
    textAlign: 'right',
    color: '#000000',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    paddingRight: 8,
    borderTop: '1px solid #000000',
  },
  grandTotalLabel: {
    width: '150px',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
    marginRight: 20,
    color: '#000000',
  },
  grandTotalValue: {
    width: '100px',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#000000',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1px solid #e5e5e5',
    fontSize: 9,
    color: '#666666',
    textAlign: 'center',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    display: 'inline-block',
    marginTop: 5,
  },
  statusPaid: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusOverdue: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  metaInfo: {
    marginTop: 20,
    paddingTop: 15,
    borderTop: '1px solid #e5e5e5',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  metaLabel: {
    fontSize: 9,
    color: '#666666',
  },
  metaValue: {
    fontSize: 9,
    color: '#000000',
    fontWeight: 'bold',
  },
});

interface InvoicePDFTemplateProps {
  invoice: {
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
  };
}

export const InvoicePDFTemplate: React.FC<InvoicePDFTemplateProps> = ({
  invoice,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `AED ${amount.toFixed(2)}`;
  };

  const getStatusStyle = () => {
    switch (invoice.status) {
      case 'paid':
        return styles.statusPaid;
      case 'pending':
        return styles.statusPending;
      case 'overdue':
        return styles.statusOverdue;
      default:
        return styles.statusPending;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <View style={[styles.statusBadge, getStatusStyle()]}>
            <Text>{invoice.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Bill To / From Section */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Bill To</Text>
            <Text style={styles.textBold}>{invoice.customer.name}</Text>
            <Text style={styles.text}>{invoice.customer.email}</Text>
            <Text style={styles.text}>{invoice.customer.phone}</Text>
            <Text style={styles.text}>{invoice.customer.address}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>From</Text>
            <Text style={styles.textBold}>{invoice.restaurant.name}</Text>
            <Text style={styles.text}>{invoice.restaurant.address}</Text>
            <Text style={styles.text}>{invoice.restaurant.phone}</Text>
            <Text style={styles.text}>{invoice.restaurant.email}</Text>
          </View>
        </View>

        {/* Meta Information */}
        <View style={styles.metaInfo}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Order Number:</Text>
            <Text style={styles.metaValue}>{invoice.orderNumber}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Issue Date:</Text>
            <Text style={styles.metaValue}>{formatDate(invoice.issueDate)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Due Date:</Text>
            <Text style={styles.metaValue}>{formatDate(invoice.dueDate)}</Text>
          </View>
          {invoice.paidDate && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Paid Date:</Text>
              <Text style={styles.metaValue}>{formatDate(invoice.paidDate)}</Text>
            </View>
          )}
          {invoice.paymentMethod && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Payment Method:</Text>
              <Text style={styles.metaValue}>{invoice.paymentMethod}</Text>
            </View>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCol1}>Item Description</Text>
            <Text style={styles.tableCol2}>Qty</Text>
            <Text style={styles.tableCol3}>Price</Text>
            <Text style={styles.tableCol4}>Total</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 0 ? styles.tableRowEven : {},
              ]}
            >
              <Text style={styles.tableCol1}>{item.name}</Text>
              <Text style={styles.tableCol2}>{item.quantity}</Text>
              <Text style={styles.tableCol3}>{formatCurrency(item.price)}</Text>
              <Text style={styles.tableCol4}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.subtotal)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (5%):</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.tax)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Amount:</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(invoice.total)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text style={{ marginTop: 5 }}>
            This invoice was generated automatically. For questions, please
            contact {invoice.restaurant.email}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
