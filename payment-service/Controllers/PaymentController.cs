// ================================================================
// Controllers/PaymentController.cs — Payment API Endpoints
// ================================================================
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaymentService.Data;
using PaymentService.Models;
using PaymentService.Services;

namespace PaymentService.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentController : ControllerBase
{
    private readonly RazorpayService _razorpay;
    private readonly EmailService _email;
    private readonly PaymentDbContext _db;
    private readonly ILogger<PaymentController> _logger;

    public PaymentController(
        RazorpayService razorpay,
        EmailService email,
        PaymentDbContext db,
        ILogger<PaymentController> logger)
    {
        _razorpay = razorpay;
        _email    = email;
        _db       = db;
        _logger   = logger;
    }

    // ----------------------------------------------------------------
    // POST /api/payments/create-order
    // Called by Node.js payment proxy with bookingId + amount
    // ----------------------------------------------------------------
    [HttpPost("create-order")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest req)
    {
        if (req.Amount <= 0)
            return BadRequest(new { error = "Amount must be greater than 0" });

        try
        {
            var (orderId, keyId) = await _razorpay.CreateOrderAsync(
                req.Amount, req.Currency, req.BookingId);

            _logger.LogInformation(
                "Order created for booking {BookingId}: {OrderId}", req.BookingId, orderId);

            return Ok(new
            {
                orderId,
                keyId,
                amount   = req.Amount,
                currency = req.Currency
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Order creation failed for booking {BookingId}", req.BookingId);
            return StatusCode(502, new { error = "Failed to create Razorpay order" });
        }
    }

    // ----------------------------------------------------------------
    // POST /api/payments/verify
    // Verifies signature → returns valid flag + payment method
    // ----------------------------------------------------------------
    [HttpPost("verify")]
    public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentRequest req)
    {
        // 1. Idempotency: check if already processed
        var existing = await _db.Payments
            .FirstOrDefaultAsync(p => p.RazorpayPaymentId == req.RazorpayPaymentId);

        if (existing != null && existing.Status == "Success")
        {
            _logger.LogInformation(
                "Duplicate verify request for paymentId={PaymentId} — already processed", req.RazorpayPaymentId);
            return Ok(new { valid = true, alreadyProcessed = true });
        }

        // 2. Verify HMAC-SHA256 signature
        var isValid = _razorpay.VerifySignature(
            req.RazorpayOrderId, req.RazorpayPaymentId, req.RazorpaySignature);

        if (!isValid)
        {
            _logger.LogWarning("Invalid signature for orderId={OrderId}", req.RazorpayOrderId);
            return BadRequest(new { valid = false, error = "Invalid payment signature" });
        }

        // 3. Fetch payment method from Razorpay
        var method = await _razorpay.GetPaymentMethodAsync(req.RazorpayPaymentId);

        // 4. Update payment record in DB
        var payment = await _db.Payments
            .FirstOrDefaultAsync(p => p.RazorpayOrderId == req.RazorpayOrderId);

        if (payment != null)
        {
            payment.RazorpayPaymentId = req.RazorpayPaymentId;
            payment.RazorpaySignature = req.RazorpaySignature;
            payment.Status            = "Success";
            payment.PaymentMethod     = method;
            payment.PaymentDate       = DateTime.UtcNow;
            payment.UpdatedAt         = DateTime.UtcNow;
            payment.GatewayResponse   = System.Text.Json.JsonSerializer.Serialize(req);
            await _db.SaveChangesAsync();
        }

        return Ok(new { valid = true, paymentMethod = method, gatewayResponse = req });
    }

    // ----------------------------------------------------------------
    // POST /api/payments/refund
    // Called by Node.js when a booking is cancelled (confirmed payment)
    // ----------------------------------------------------------------
    [HttpPost("refund")]
    public async Task<IActionResult> RefundPayment([FromBody] RefundRequest req)
    {
        try
        {
            var refundId = await _razorpay.CreateRefundAsync(req.RazorpayPaymentId, req.Amount);

            // Update DB
            var payment = await _db.Payments
                .FirstOrDefaultAsync(p => p.RazorpayPaymentId == req.RazorpayPaymentId);

            if (payment != null)
            {
                payment.RefundId     = refundId;
                payment.RefundStatus = "Processed";
                payment.Status       = "Refunded";
                payment.UpdatedAt    = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }

            return Ok(new { refundId, status = "Processed" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Refund failed for payment {PaymentId}", req.RazorpayPaymentId);
            return StatusCode(502, new { error = "Refund initiation failed" });
        }
    }

    // ----------------------------------------------------------------
    // GET /health
    // Health check for monitoring
    // ----------------------------------------------------------------
    [HttpGet("/health")]
    public IActionResult Health() =>
        Ok(new { status = "ok", timestamp = DateTime.UtcNow, service = "skybooker-payment" });
}
