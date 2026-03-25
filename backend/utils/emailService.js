// ================================================================
// utils/emailService.js — Nodemailer Email Dispatch
// ================================================================
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    const useEthereal = process.env.SMTP_HOST === 'test';

    if (useEthereal) {
        // Ethereal for development: auto-creates preview URLs
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
    }

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        pool: true,
        maxConnections: 3,
        maxMessages: 100
    });

    return transporter;
}

// ----------------------------------------------------------------
// Base send helper
// ----------------------------------------------------------------
async function sendEmail({ to, toName, subject, html, attachments = [] }) {
    const t = getTransporter();
    const from = `"${process.env.EMAIL_FROM_NAME || 'SkyBooker'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@skybooker.com'}>`;

    const info = await t.sendMail({ from, to: `"${toName}" <${to}>`, subject, html, attachments });

    if (process.env.NODE_ENV !== 'production') {
        console.log('[Email] Sent:', info.messageId);
        if (info.preview) console.log('[Email] Preview:', nodemailer.getTestMessageUrl(info));
    }

    return info;
}

// ----------------------------------------------------------------
// 1. Booking Confirmation Email (with optional PDF attachments)
// ----------------------------------------------------------------
async function sendBookingConfirmation({ to, toName, bookingRef, flightNumber, originCity, destCity, departureTime, arrivalTime, totalAmount, currency = 'INR', pdfPaths = [] }) {
    const dep = new Date(departureTime);
    const arr = new Date(arrivalTime);
    const fmtDT = (d) => d.toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false });
    const fmtINR = (n) => `${currency} ${parseFloat(n).toLocaleString('en-IN')}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmed — SkyBooker</title>
</head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:'Segoe UI',system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0f3460,#1a1040);border-radius:16px;padding:32px;margin-bottom:24px;border:1px solid rgba(0,180,216,0.2);">
      <div style="margin-bottom:8px;font-size:14px;color:#00b4d8;font-weight:600;letter-spacing:2px;">✈ SKYBOOKER</div>
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:900;color:#4ade80;">🎉 Booking Confirmed!</h1>
      <p style="margin:0;color:#94a3b8;font-size:15px;">Your flight is booked and your e-tickets are attached.</p>
    </div>

    <!-- Booking Ref -->
    <div style="background:rgba(0,180,216,0.08);border:1px solid rgba(0,180,216,0.25);border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
      <div style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Booking Reference</div>
      <div style="color:#f0f4ff;font-size:28px;font-weight:900;letter-spacing:4px;font-family:monospace;">${bookingRef}</div>
    </div>

    <!-- Flight Details -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Route</div>
            <div style="color:#f0f4ff;font-size:18px;font-weight:700;margin-top:4px;">${originCity} → ${destCity}</div>
          </td>
          <td style="padding:10px 0 10px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Flight</div>
            <div style="color:#f0f4ff;font-size:16px;font-weight:600;margin-top:4px;">${flightNumber}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Departure</div>
            <div style="color:#00b4d8;font-size:14px;font-weight:600;margin-top:4px;">${fmtDT(dep)}</div>
          </td>
          <td style="padding:10px 0 10px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Arrival</div>
            <div style="color:#00b4d8;font-size:14px;font-weight:600;margin-top:4px;">${fmtDT(arr)}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:14px 0 0;">
            <div style="color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Amount Paid</div>
            <div style="color:#4ade80;font-size:24px;font-weight:900;margin-top:6px;">${fmtINR(totalAmount)}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Notice -->
    <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:10px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;color:#fbbf24;font-size:13px;line-height:1.7;">
        📎 <strong>Your e-tickets are attached as PDFs.</strong> Please carry a printed or digital copy to the airport. Present it at check-in along with a valid photo ID.
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${process.env.APP_URL || 'http://localhost:5173'}/bookings"
         style="display:inline-block;background:linear-gradient(135deg,#00b4d8,#7c3aed);color:#fff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;">
        View My Bookings
      </a>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;text-align:center;">
      <p style="color:#334155;font-size:12px;line-height:1.8;margin:0;">
        SkyBooker · support@skybooker.com<br/>
        This is an automated message. Please do not reply directly.
      </p>
    </div>
  </div>
</body>
</html>`;

    // Build attachments from PDF paths
    const attachments = pdfPaths
        .filter(p => p && fs.existsSync(p))
        .map((p, i) => ({
            filename: `SkyBooker-Ticket-${i + 1}.pdf`,
            path: p,
            contentType: 'application/pdf'
        }));

    return sendEmail({ to, toName, subject: `✈ Booking Confirmed — ${bookingRef} | SkyBooker`, html, attachments });
}

// ----------------------------------------------------------------
// 2. Booking Cancellation Email
// ----------------------------------------------------------------
async function sendCancellationEmail({ to, toName, bookingRef, flightNumber, originCity, destCity, refundAmount, currency = 'INR' }) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#0a0e1a;font-family:'Segoe UI',system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2);border-radius:16px;padding:32px;margin-bottom:24px;">
      <div style="margin-bottom:8px;font-size:14px;color:#00b4d8;font-weight:600;">✈ SKYBOOKER</div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#f87171;">Booking Cancelled</h1>
      <p style="margin:0;color:#94a3b8;">Your booking has been successfully cancelled.</p>
    </div>

    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;margin-bottom:20px;color:#94a3b8;font-size:14px;line-height:2;">
      <strong style="color:#f0f4ff;">Booking Ref:</strong> <code style="color:#00b4d8;">${bookingRef}</code><br/>
      <strong style="color:#f0f4ff;">Flight:</strong> ${flightNumber} — ${originCity} → ${destCity}
    </div>

    ${refundAmount > 0 ? `
    <div style="background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:10px;padding:16px;margin-bottom:20px;">
      <p style="margin:0;color:#4ade80;font-size:14px;">
        💰 <strong>Refund of ${currency} ${parseFloat(refundAmount).toLocaleString('en-IN')}</strong> will be processed to your original payment method within 5–7 business days.
      </p>
    </div>` : ''}

    <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;text-align:center;">
      <p style="color:#334155;font-size:12px;margin:0;">SkyBooker · support@skybooker.com</p>
    </div>
  </div>
</body>
</html>`;

    return sendEmail({ to, toName, subject: `Booking Cancelled — ${bookingRef} | SkyBooker`, html });
}

module.exports = { sendBookingConfirmation, sendCancellationEmail };
