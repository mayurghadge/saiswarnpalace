import jsPDF from 'jspdf';

export const downloadInvoicePdf = ({
  orderNumber,
  date,
  customerName,
  shippingAddress,
  paymentMethod,
  items = [],
  subtotal = 0,
  tax = 0,
  discount = 0,
  total = 0,
}) => {
  const pdf = new jsPDF();
  let y = 20;

  pdf.setFontSize(20);
  pdf.text('Sai Swarn Palace', 14, y);
  y += 8;
  pdf.setFontSize(11);
  pdf.text('Invoice / Order Summary', 14, y);
  y += 12;

  pdf.setFontSize(10);
  pdf.text(`Order Number: ${orderNumber}`, 14, y);
  pdf.text(`Date: ${date}`, 140, y);
  y += 7;
  pdf.text(`Customer: ${customerName}`, 14, y);
  pdf.text(`Payment: ${paymentMethod || 'Online'}`, 140, y);
  y += 10;

  if (shippingAddress) {
    pdf.setFontSize(11);
    pdf.text('Shipping Address', 14, y);
    y += 7;
    pdf.setFontSize(10);
    pdf.text(`${shippingAddress.name || ''}`, 14, y);
    y += 6;
    pdf.text(`${shippingAddress.address || ''}`, 14, y);
    y += 6;
    pdf.text(`${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.pincode || ''}`, 14, y);
    y += 6;
    pdf.text(`Phone: ${shippingAddress.phone || ''}`, 14, y);
    y += 12;
  }

  pdf.setFontSize(11);
  pdf.text('Ordered Items', 14, y);
  y += 8;

  pdf.setFillColor(245, 245, 245);
  pdf.rect(14, y - 5, 182, 8, 'F');
  pdf.setFontSize(10);
  pdf.text('Item', 16, y);
  pdf.text('Qty', 120, y);
  pdf.text('Price', 140, y);
  pdf.text('Total', 170, y);
  y += 8;

  items.forEach((item) => {
    const lineTotal = Number(item.price || 0) * Number(item.quantity || 1);
    const itemName = String(item.name || item.product_name || 'Product').slice(0, 45);

    if (y > 260) {
      pdf.addPage();
      y = 20;
    }

    pdf.text(itemName, 16, y);
    pdf.text(String(item.quantity || 1), 122, y);
    pdf.text(`Rs.${Math.round(Number(item.price || 0)).toLocaleString()}`, 140, y);
    pdf.text(`Rs.${Math.round(lineTotal).toLocaleString()}`, 170, y);
    y += 7;
  });

  y += 8;
  pdf.line(14, y, 196, y);
  y += 8;
  pdf.text(`Subtotal: Rs.${Math.round(subtotal).toLocaleString()}`, 140, y);
  y += 7;
  pdf.text(`GST/Tax: Rs.${Math.round(tax).toLocaleString()}`, 140, y);
  y += 7;
  if (discount > 0) {
    pdf.text(`Coupon Discount: -Rs.${Math.round(discount).toLocaleString()}`, 140, y);
    y += 7;
  }
  pdf.setFontSize(12);
  pdf.text(`Grand Total: Rs.${Math.round(total).toLocaleString()}`, 140, y);

  pdf.save(`${orderNumber || 'invoice'}.pdf`);
};