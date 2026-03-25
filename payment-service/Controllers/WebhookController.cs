// ================================================================
// Controllers/WebhookController.cs — Razorpay Webhook Handler
// ================================================================
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaymentService.Data;
using PaymentService.Services;
using System.Text;
using System.Text.Json;

namespace PaymentService.Controllers;

[ApiController]
[Route("api/webhooks")]
public class WebhookController : ControllerBase
{
    private readonly RazorpayService _razorpay;
    private readonly EmailService _email;
    private readonly PaymentDbContext _db;
    private readonly ILogger<WebhookController> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;

    public WebhookController(
        RazorpayService razorpay,
        EmailService email,
        PaymentDbContext db,
        ILogger<WebhookController> logger,
        IHttpClientFactory httpClientFactory,
        IConfiguration config)
    {
        _razorpay          = razorpay;
        _email             = email;
        _db                = db;
        _logger            = logger;
        _httpClientFactory = httpClientFactory;
        _config            = config;
    }

    // ----------------------------------------------------------------
    // POST /api/webhooks/razorpay
    // Razorpay sends verified webhook events asynchronously
    // ----------------------------------------------------------------
    [HttpPost("razorpay")]
    public async Task<IActionResult> HandleWebhook()
    {
        // 1. Read raw body for signature verification
        string rawBody;
        using (var reader = new StreamReader(Request.Body, Encoding.UTF8))
        {
            rawBody = await reader.ReadToEndAsync();
        }

        // 2. Get Razorpay-Signature header
        if (!Request.Headers.TryGetValue("X-Razorpay-Signature", out var signature))
        {
            _logger.LogWarning("Webhook received without X-Razorpay-Signature header");
            return BadRequest(new { error = "Missing signature" });
        }

        // 3. Verify webhook signature (HMAC-SHA256 with webhook secret)
        if (!_razorpay.VerifyWebhookSignature(rawBody, signature!))
        {
            _logger.LogWarning("Webhook signature verification failed. Possible spoofing attempt.");
            return Unauthorized(new { error = "Invalid webhook signature" });
        }

        // 4. Parse the event
        JsonDocument doc;
        try { doc = JsonDocument.Parse(rawBody); }
        catch { return BadRequest(new { error = "Invalid JSON payload" }); }

        var eventName = doc.RootElement.GetProperty("event").GetString();
        _logger.LogInformation("Razorpay webhook received: {Event}", eventName);

        // 5. Handle events
        switch (eventName)
        {
            case "payment.captured":
                await HandlePaymentCaptured(doc);
                break;

            case "payment.failed":
                await HandlePaymentFailed(doc);
                break;

            case "refund.processed":
                await HandleRefundProcessed(doc);
                break;

            default:
                _logger.LogInformation("Unhandled webhook event: {Event}", eventName);
                break;
        }

        // Always return 200 — tells Razorpay to stop retrying
        return Ok(new { received = true });
    }

    // ---- Event Handlers ----

    private async Task HandlePaymentCaptured(JsonDocument doc)
    {
        try
        {
            var entity      = doc.RootElement
                .GetProperty("payload").GetProperty("payment").GetProperty("entity");
            var paymentId   = entity.GetProperty("id").GetString()!;
            var orderId     = entity.TryGetProperty("order_id", out var oid) ? oid.GetString() : null;
            var method      = entity.TryGetProperty("method", out var m) ? m.GetString() : null;

            // Idempotency: skip if already processed
            var existing = await _db.Payments
                .FirstOrDefaultAsync(p => p.RazorpayPaymentId == paymentId);
            if (existing?.Status == "Success")
            {
                _logger.LogInformation("Webhook payment.captured already processed: {PaymentId}", paymentId);
                return;
            }

            // Update DB
            var payment = await _db.Payments
                .FirstOrDefaultAsync(p => p.RazorpayOrderId == orderId);

            if (payment != null)
            {
                payment.RazorpayPaymentId = paymentId;
                payment.Status            = "Success";
                payment.PaymentMethod     = method;
                payment.PaymentDate       = DateTime.UtcNow;
                payment.UpdatedAt         = DateTime.UtcNow;
                payment.GatewayResponse   = doc.RootElement.ToString();
                await _db.SaveChangesAsync();

                _logger.LogInformation(
                    "Payment captured via webhook: bookingId={BookingId}, paymentId={PaymentId}",
                    payment.BookingId, paymentId);

                // Notify Node.js API to confirm booking (fire-and-forget)
                _ = NotifyNodeConfirmBookingAsync(payment.BookingId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling payment.captured webhook");
        }
    }

    private async Task HandlePaymentFailed(JsonDocument doc)
    {
        try
        {
            var entity    = doc.RootElement
                .GetProperty("payload").GetProperty("payment").GetProperty("entity");
            var orderId   = entity.TryGetProperty("order_id", out var oid) ? oid.GetString() : null;

            var payment = await _db.Payments
                .FirstOrDefaultAsync(p => p.RazorpayOrderId == orderId);

            if (payment != null && payment.Status != "Success")
            {
                payment.Status    = "Failed";
                payment.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                _logger.LogWarning("Payment failed via webhook: bookingId={BookingId}", payment.BookingId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling payment.failed webhook");
        }
    }

    private async Task HandleRefundProcessed(JsonDocument doc)
    {
        try
        {
            var entity    = doc.RootElement
                .GetProperty("payload").GetProperty("refund").GetProperty("entity");
            var refundId  = entity.GetProperty("id").GetString()!;
            var paymentId = entity.TryGetProperty("payment_id", out var pid) ? pid.GetString() : null;

            var payment = await _db.Payments
                .FirstOrDefaultAsync(p => p.RazorpayPaymentId == paymentId);

            if (payment != null)
            {
                payment.RefundId     = refundId;
                payment.RefundStatus = "Processed";
                payment.Status       = "Refunded";
                payment.UpdatedAt    = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                _logger.LogInformation("Refund processed: refundId={RefundId}", refundId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling refund.processed webhook");
        }
    }

    /// <summary>
    /// Notifies the Node.js API to confirm a booking after successful payment.
    /// Used when payment is captured via webhook (async path).
    /// </summary>
    private async Task NotifyNodeConfirmBookingAsync(int bookingId)
    {
        try
        {
            var nodeUrl = _config["NodeApiUrl"] ?? "http://localhost:5000";
            var apiKey  = _config["InternalApiKey"];
            var client  = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Api-Key", apiKey);

            await client.PostAsync(
                $"{nodeUrl}/api/internal/bookings/{bookingId}/confirm",
                null
            );
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not notify Node.js to confirm booking {BookingId}", bookingId);
        }
    }
}
