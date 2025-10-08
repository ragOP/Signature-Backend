// emails/signatureOrderConfirmation.js
function currencyINR(n) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n || 0);
  } catch {
    return `₹${n}`;
  }
}

/**
 * @param {{
 *  customerName: string,
 *  orderId: string,
 *  amount: number,
 *  items: Array<{title:string, price:number}>,
 *  additionalProducts?: string[],
 *  logoUrl?: string
 * }} data
 */
function signatureOrderConfirmationHTML(data) {
  const {
    customerName,
    orderId,
    amount,
    items = [],
    additionalProducts = [],
    logoUrl = "https://www.thesignaturestudio.in/logo.png", // Replace with actual Signature Studio logo
  } = data;

  const itemsHTML = items
    .map(
      (it) => `
    <tr>
      <td style="padding:8px 0;color:#111;">${it.title}</td>
      <td style="padding:8px 0;text-align:right;color:#111;">${currencyINR(
        it.price
      )}</td>
    </tr>`
    )
    .join("");

  const addonsHTML = additionalProducts
    .map(
      (t) => `
    <tr>
      <td style="padding:6px 0;color:#444;">${t} <span style="font-size:12px;color:#777">(Add-on)</span></td>
      <td style="padding:6px 0;text-align:right;color:#444;"></td>
    </tr>`
    )
    .join("");

  return `<!doctype html>
  <html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <title>Order Confirmation - The Signature Studio</title>
  </head>
  <body style="margin:0;padding:0;background:#fdf2f8;font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fdf2f8;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.06);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding:20px 28px;background:#1f2937;color:#fff;text-align:center;">
              <img src="" alt="The Signature Studio" style="height:50px;margin-bottom:8px;"/>
              <h1 style="margin:0;font-size:20px;font-weight:700;">The Signature Studio</h1>
              <p style="margin:4px 0 0;font-size:12px;opacity:0.9;">Order Confirmation</p>
            </td>
          </tr>
          <!-- Body -->
          <tr><td style="padding:28px;">
            <p style="margin:0 0 12px;color:#111;font-size:16px;">Hi ${
              customerName || "there"
            },</p>
            <p style="margin:0 0 16px;color:#333;line-height:1.6;">Thank you for shopping with us! Your payment was successful and your order is confirmed.</p>
            <div style="margin:18px 0;padding:12px 14px;background:#f3f4f6;border-radius:10px;">
              <p style="margin:0;color:#111;"><strong>Order ID:</strong> ${orderId}</p>
              <p style="margin:4px 0 0;color:#111;"><strong>Amount Paid:</strong> ${currencyINR(
                amount
              )}</p>
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">
              <tr>
                <th align="left" style="padding:8px 0;border-bottom:1px solid #d1d5db;color:#111;">Item</th>
                <th align="right" style="padding:8px 0;border-bottom:1px solid #d1d5db;color:#111;">Price</th>
              </tr>
              ${itemsHTML}
              ${addonsHTML}
              <tr>
                <td style="padding:12px 0;border-top:1px dashed #d1d5db;color:#111;"><strong>Total</strong></td>
                <td style="padding:12px 0;border-top:1px dashed #d1d5db;text-align:right;color:#111;"><strong>${currencyINR(
                  amount
                )}</strong></td>
              </tr>
            </table>
            <p style="margin:18px 0 0;color:#333;line-height:1.6;">Your order is being processed. You’ll receive updates via WhatsApp/Email. For queries, reply to <a href="mailto:orders@thesignaturestudio.in" style="color:#1f2937;text-decoration:none;">orders@thesignaturestudio.in</a>.</p>
            <p style="margin:24px 0 0;color:#111;">With love,<br/>The Signature Studio Team</p>
          </td></tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;background:#1f2937;color:#d1d5db;font-size:12px;">© ${new Date().getFullYear()} The Signature Studio. All rights reserved.</td>
          </tr>
        </table>
        <p style="color:#9aa0a6;font-size:12px;margin:14px 0 0;">This is an automated message from The Signature Studio.</p>
      </td></tr>
    </table>
  </body></html>`;
}

module.exports = { signatureOrderConfirmationHTML };
