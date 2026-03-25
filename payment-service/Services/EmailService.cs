// ================================================================
// Services/EmailService.cs — MailKit SMTP Email Dispatch
// ================================================================
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using PaymentService.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace PaymentService.Services;

public class EmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Sends booking confirmation email with ticket summary.
    /// </summary>
    public async Task SendBookingConfirmationAsync(
        string toEmail,
        string toName,
        string bookingRef,
        string flightNumber,
        string origin,
        string destination,
        DateTime departureTime,
        decimal totalAmount,
        string currency = "INR")
    {
        var subject = $"✈ Booking Confirmed — {bookingRef} | SkyBooker";
        var body = BuildConfirmationHtml(
            toName, bookingRef, flightNumber, origin, destination,
            departureTime, totalAmount, currency
        );

        await SendEmailAsync(toEmail, toName, subject, body);
    }

    /// <summary>
    /// Sends cancellation notification email.
    /// </summary>
    public async Task SendCancellationNotificationAsync(
        string toEmail, string toName, string bookingRef, decimal refundAmount, string currency = "INR")
    {
        var subject = $"Booking Cancelled — {bookingRef} | SkyBooker";
        var body = $@"
<html><body style='font-family:sans-serif;max-width:600px;margin:auto'>
<div style='background:#1a1a2e;padding:32px;border-radius:12px'>
  <h2 style='color:#00b4d8'>SkyBooker</h2>
  <p style='color:#ccc'>Dear {toName},</p>
  <p style='color:#ccc'>Your booking <strong style='color:#fff'>{bookingRef}</strong> has been cancelled.</p>
  {(refundAmount > 0 ? $"<p style='color:#4ade80'>Refund of <strong>{currency} {refundAmount:F2}</strong> will be processed within 5–7 business days.</p>" : "")}
  <p style='color:#666;font-size:12px;margin-top:32px'>SkyBooker · support@skybooker.com</p>
</div>
</body></html>";

        await SendEmailAsync(toEmail, toName, subject, body);
    }

    private async Task SendEmailAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        var settings = _config.GetSection("EmailSettings");
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            settings["FromName"] ?? "SkyBooker",
            settings["FromAddress"] ?? "noreply@skybooker.com"
        ));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        try
        {
            using var client = new SmtpClient();
            var useSsl = bool.Parse(settings["UseSsl"] ?? "false");
            var secureOption = useSsl
                ? SecureSocketOptions.SslOnConnect
                : SecureSocketOptions.StartTlsWhenAvailable;

            await client.ConnectAsync(
                settings["SmtpHost"] ?? "smtp.gmail.com",
                int.Parse(settings["SmtpPort"] ?? "587"),
                secureOption
            );
            await client.AuthenticateAsync(settings["Username"], settings["Password"]);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent to {Email} — Subject: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            // Non-fatal: log but don't throw. Ticket still accessible via API.
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
        }
    }

    private static string BuildConfirmationHtml(
        string toName, string bookingRef, string flightNumber,
        string origin, string destination, DateTime departureTime,
        decimal totalAmount, string currency)
    {
        return $@"
<html><body style='font-family:sans-serif;max-width:600px;margin:auto'>
<div style='background:#1a1a2e;padding:32px;border-radius:12px'>
  <h2 style='color:#00b4d8'>✈ SkyBooker</h2>
  <h3 style='color:#4ade80'>Booking Confirmed!</h3>
  <p style='color:#ccc'>Dear <strong style='color:#fff'>{toName}</strong>,</p>
  <p style='color:#ccc'>Your flight has been successfully booked.</p>

  <div style='background:#0f3460;border-radius:8px;padding:20px;margin:20px 0'>
    <table style='width:100%;color:#ccc;font-size:14px'>
      <tr><td style='padding:6px 0'><strong style='color:#00b4d8'>Booking Ref</strong></td>
          <td style='color:#fff;font-weight:bold;font-size:18px'>{bookingRef}</td></tr>
      <tr><td style='padding:6px 0'><strong style='color:#00b4d8'>Flight</strong></td>
          <td>{flightNumber}</td></tr>
      <tr><td style='padding:6px 0'><strong style='color:#00b4d8'>Route</strong></td>
          <td>{origin} → {destination}</td></tr>
      <tr><td style='padding:6px 0'><strong style='color:#00b4d8'>Departure</strong></td>
          <td>{departureTime:ddd, dd MMM yyyy HH:mm}</td></tr>
      <tr><td style='padding:6px 0'><strong style='color:#00b4d8'>Amount Paid</strong></td>
          <td style='color:#4ade80;font-weight:bold;font-size:18px'>{currency} {totalAmount:F2}</td></tr>
    </table>
  </div>

  <p style='color:#ccc'>Log in to <a href='http://localhost:5173/bookings' style='color:#00b4d8'>SkyBooker</a> to view and download your e-tickets.</p>
  <p style='color:#666;font-size:12px;margin-top:32px'>SkyBooker · support@skybooker.com · This is an automated message.</p>
</div>
</body></html>";
    }
}
