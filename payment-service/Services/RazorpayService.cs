// ================================================================
// Services/RazorpayService.cs — Razorpay Integration
// ================================================================
using Razorpay.Api;
using PaymentService.Models;
using System.Text;
using System.Security.Cryptography;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace PaymentService.Services;

public class RazorpayService
{
    private readonly string _keyId;
    private readonly string _keySecret;
    private readonly string _webhookSecret;
    private readonly ILogger<RazorpayService> _logger;

    public RazorpayService(IConfiguration config, ILogger<RazorpayService> logger)
    {
        _keyId        = config["Razorpay:KeyId"]        ?? throw new InvalidOperationException("Razorpay:KeyId not configured");
        _keySecret    = config["Razorpay:KeySecret"]    ?? throw new InvalidOperationException("Razorpay:KeySecret not configured");
        _webhookSecret = config["Razorpay:WebhookSecret"] ?? throw new InvalidOperationException("Razorpay:WebhookSecret not configured");
        _logger = logger;
    }

    private RazorpayClient GetClient() => new RazorpayClient(_keyId, _keySecret);

    /// <summary>
    /// Creates a Razorpay order.
    /// Amount must be in smallest currency unit (paise for INR).
    /// </summary>
    public async Task<(string OrderId, string KeyId)> CreateOrderAsync(
        decimal amount, string currency, int bookingId)
    {
        return await Task.Run(() =>
        {
            var client = GetClient();
            var amountInPaise = (int)(amount * 100); // INR → paise

            var options = new Dictionary<string, object>
            {
                { "amount",   amountInPaise },
                { "currency", currency },
                { "receipt",  $"receipt_booking_{bookingId}" },
                { "notes",    new Dictionary<string, string>
                    {
                        { "booking_id", bookingId.ToString() }
                    }
                }
            };

            var order = client.Order.Create(options);
            string orderId = order["id"].ToString()!;

            _logger.LogInformation(
                "Razorpay order created: {OrderId} for booking {BookingId}, amount {Amount} {Currency}",
                orderId, bookingId, amount, currency
            );

            return (orderId, _keyId);
        });
    }

    /// <summary>
    /// Verifies Razorpay payment signature using HMAC-SHA256.
    /// Signature = HMAC-SHA256(orderId + "|" + paymentId, keySecret)
    /// </summary>
    public bool VerifySignature(string razorpayOrderId, string razorpayPaymentId, string razorpaySignature)
    {
        try
        {
            var payload = $"{razorpayOrderId}|{razorpayPaymentId}";
            var keyBytes = Encoding.UTF8.GetBytes(_keySecret);
            var payloadBytes = Encoding.UTF8.GetBytes(payload);

            using var hmac = new HMACSHA256(keyBytes);
            var hash = hmac.ComputeHash(payloadBytes);
            var computedSignature = BitConverter.ToString(hash).Replace("-", "").ToLower();

            var isValid = computedSignature == razorpaySignature;

            if (!isValid)
            {
                _logger.LogWarning(
                    "Signature verification FAILED for orderId={OrderId}, paymentId={PaymentId}",
                    razorpayOrderId, razorpayPaymentId
                );
            }
            else
            {
                _logger.LogInformation(
                    "Signature verified for orderId={OrderId}, paymentId={PaymentId}",
                    razorpayOrderId, razorpayPaymentId
                );
            }

            return isValid;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception during signature verification");
            return false;
        }
    }

    /// <summary>
    /// Verifies the Razorpay webhook signature.
    /// Signature = HMAC-SHA256(rawBody, webhookSecret)
    /// </summary>
    public bool VerifyWebhookSignature(string rawBody, string receivedSignature)
    {
        var keyBytes = Encoding.UTF8.GetBytes(_webhookSecret);
        var bodyBytes = Encoding.UTF8.GetBytes(rawBody);

        using var hmac = new HMACSHA256(keyBytes);
        var hash = hmac.ComputeHash(bodyBytes);
        var computedSignature = BitConverter.ToString(hash).Replace("-", "").ToLower();

        return computedSignature == receivedSignature;
    }

    /// <summary>
    /// Fetches payment details from Razorpay (for webhook enrichment).
    /// </summary>
    public async Task<string?> GetPaymentMethodAsync(string razorpayPaymentId)
    {
        return await Task.Run(() =>
        {
            try
            {
                var client = GetClient();
                var payment = client.Payment.Fetch(razorpayPaymentId);
                return payment["method"]?.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not fetch payment method for {PaymentId}", razorpayPaymentId);
                return null;
            }
        });
    }

    /// <summary>
    /// Initiates a full or partial refund on Razorpay.
    /// </summary>
    public async Task<string> CreateRefundAsync(string razorpayPaymentId, decimal amount)
    {
        return await Task.Run(() =>
        {
            var client = GetClient();
            var amountInPaise = (int)(amount * 100);

            var options = new Dictionary<string, object>
            {
                { "payment_id", razorpayPaymentId },
                { "amount",     amountInPaise },
                { "speed",      "normal" }
            };

            var refund = client.Refund.Create(options);
            string refundId = refund["id"].ToString()!;

            _logger.LogInformation(
                "Refund created: {RefundId} for payment {PaymentId}, amount {Amount}",
                refundId, razorpayPaymentId, amount
            );

            return refundId;
        });
    }
}
