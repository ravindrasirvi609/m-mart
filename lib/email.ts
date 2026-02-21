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

function renderOrderHtml(payload: OrderEmailPayload, env: ReturnType<typeof getServerEnv>) {
  const itemsHtml = payload.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #edf2f7;">
        <td style="padding: 12px 0; color: #4a5568;">${item.name} <span style="font-size: 12px; color: #718096;">× ${item.quantity}</span></td>
        <td style="padding: 12px 0; text-align: right; color: #1a202c; font-weight: 600;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>`,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      </head>
      <body style="background-color: #f7f8fa; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ff3b30, #e10600); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Mmart</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin-top: 8px; font-size: 14px;">Fresh Groceries Delivered Fast</p>
          </div>

          <!-- Body -->
          <div style="padding: 32px 24px;">
            <h2 style="color: #111827; margin: 0 0 16px; font-size: 20px; font-weight: 700;">Order Confirmation</h2>
            <p style="color: #4b5563; margin-bottom: 24px; line-height: 1.5;">Hi ${payload.customerName || "Customer"}, your order has been placed successfully. We're getting it ready for delivery!</p>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #f3f4f6;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Order Details</p>
              <p style="margin: 0; color: #111827; font-weight: 500;">Order ID: <span style="font-family: monospace; color: #e10600;">#${payload.orderId.slice(0, 8)}</span></p>
              <p style="margin: 4px 0 0; color: #111827; font-weight: 500;">Status: <span style="color: #059669;">${payload.paymentStatus}</span></p>
            </div>

            <div style="margin-bottom: 24px;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Delivery Address</p>
              <p style="margin: 0; color: #111827; line-height: 1.5;">${payload.deliveryAddress}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr>
                  <th style="text-align: left; padding-bottom: 8px; color: #6b7280; font-size: 13px; text-transform: uppercase; font-weight: 600; border-bottom: 2px solid #f3f4f6;">Item</th>
                  <th style="text-align: right; padding-bottom: 8px; color: #6b7280; font-size: 13px; text-transform: uppercase; font-weight: 600; border-bottom: 2px solid #f3f4f6;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td style="padding-top: 16px; font-size: 16px; font-weight: 700; color: #111827;">Total Amount</td>
                  <td style="padding-top: 16px; text-align: right; font-size: 20px; font-weight: 800; color: #e10600;">${formatCurrency(payload.total)}</td>
                </tr>
              </tfoot>
            </table>

            <div style="text-align: center; margin-top: 32px;">
              <a href="${env.NEXT_PUBLIC_BASE_URL}/orders/${payload.orderId}" style="display: inline-block; background-color: #e10600; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(225, 6, 0, 0.2);">Track Your Order</a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #f3f4f6;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} Mmart Grocery. All rights reserved.</p>
            <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px;">Mukai Nagar, Hinjewadi Phase 1, Pune</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendOrderEmails(payload: OrderEmailPayload) {
  const env = getServerEnv();

  if (!env.RESEND_API_KEY) {
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const fromEmail = env.RESEND_FROM_EMAIL || "Mmart <onboarding@resend.dev>";

  const html = renderOrderHtml(payload, env);

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
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        </head>
        <body style="background-color: #f7f8fa; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb;">
            <div style="background: #111827; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.025em;">Mmart Inventory</h1>
            </div>
            
            <div style="padding: 32px 24px;">
              <h2 style="color: #dc2626; margin: 0 0 16px; font-size: 20px; font-weight: 700;">Low Stock Alert</h2>
              <p style="color: #4b5563; margin-bottom: 24px; line-height: 1.5;">The following products are running low on stock and need to be restocked soon:</p>
              
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="text-align: left; padding-bottom: 8px; color: #6b7280; font-size: 13px; text-transform: uppercase; font-weight: 600; border-bottom: 2px solid #f3f4f6;">Product Name</th>
                    <th style="text-align: right; padding-bottom: 8px; color: #6b7280; font-size: 13px; text-transform: uppercase; font-weight: 600; border-bottom: 2px solid #f3f4f6;">Stock Left</th>
                  </tr>
                </thead>
                <tbody>
                  ${lowStockProducts
        .map(
          (item) => `
                    <tr style="border-bottom: 1px solid #edf2f7;">
                      <td style="padding: 12px 0; color: #1a202c; font-weight: 500;">${item.name}</td>
                      <td style="padding: 12px 0; text-align: right; color: #dc2626; font-weight: 700;">${item.stock}</td>
                    </tr>`,
        )
        .join("")}
                </tbody>
              </table>

              <div style="text-align: center; margin-top: 32px;">
                <a href="${env.NEXT_PUBLIC_BASE_URL || "https://mmart4u.com"}/admin/products" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none;">Manage Inventory</a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}
