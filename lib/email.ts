import { Resend } from "resend";

import { getServerEnv } from "@/lib/env";
import { formatCurrency } from "@/lib/utils";

type EmailItem = {
  name: string;
  quantity: number;
  price: number;
};

type OrderEmailPayload = {
  orderId: string;
  customerEmail: string;
  customerName: string;
  deliveryAddress: string;
  items: EmailItem[];
  total: number;
  paymentStatus: string;
};

function renderOrderHtml(payload: OrderEmailPayload) {
  const itemsHtml = payload.items
    .map(
      (item) =>
        `<li>${item.name} × ${item.quantity} - ${formatCurrency(item.price * item.quantity)}</li>`,
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
      <h2>Order Confirmation - ${payload.orderId}</h2>
      <p>Hi ${payload.customerName || "Customer"}, your order has been placed successfully.</p>
      <p><strong>Delivery Address:</strong> ${payload.deliveryAddress}</p>
      <p><strong>Payment Status:</strong> ${payload.paymentStatus}</p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total:</strong> ${formatCurrency(payload.total)}</p>
    </div>
  `;
}

export async function sendOrderEmails(payload: OrderEmailPayload) {
  const env = getServerEnv();

  if (!env.RESEND_API_KEY) {
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const fromEmail = env.RESEND_FROM_EMAIL || "Mmart <onboarding@resend.dev>";

  const html = renderOrderHtml(payload);

  await Promise.allSettled([
    resend.emails.send({
      from: fromEmail,
      to: payload.customerEmail,
      subject: `Mmart Order Confirmation #${payload.orderId.slice(0, 8)}`,
      html,
    }),
    resend.emails.send({
      from: fromEmail,
      to: env.ADMIN_EMAIL,
      subject: `New Mmart Order #${payload.orderId.slice(0, 8)}`,
      html,
    }),
  ]);
}

export async function sendLowStockEmail(
  lowStockProducts: Array<{ name: string; stock: number }>,
) {
  const env = getServerEnv();

  if (!env.RESEND_API_KEY || lowStockProducts.length === 0) {
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const fromEmail = env.RESEND_FROM_EMAIL || "Mmart <onboarding@resend.dev>";

  await resend.emails.send({
    from: fromEmail,
    to: env.ADMIN_EMAIL,
    subject: "Mmart Low Stock Alert",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
        <h2>Low Stock Alert</h2>
        <ul>
          ${lowStockProducts
            .map((item) => `<li>${item.name}: ${item.stock} left</li>`)
            .join("")}
        </ul>
      </div>
    `,
  });
}
