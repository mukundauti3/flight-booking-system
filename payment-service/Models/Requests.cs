// ================================================================
// Models/Requests.cs — Request/Response DTOs
// ================================================================
namespace PaymentService.Models;

// POST /api/payments/create-order
public record CreateOrderRequest(
    int BookingId,
    decimal Amount,
    string Currency = "INR"
);

// POST /api/payments/verify
public record VerifyPaymentRequest(
    string RazorpayOrderId,
    string RazorpayPaymentId,
    string RazorpaySignature
);

// POST /api/payments/refund
public record RefundRequest(
    int BookingId,
    string RazorpayPaymentId,
    decimal Amount,
    string Reason = "Customer requested cancellation"
);

// Webhook event envelope
public record WebhookEvent(
    string @Event,
    WebhookPayload Payload
);

public record WebhookPayload(
    WebhookPaymentEntity Payment
);

public record WebhookPaymentEntity(
    WebhookPaymentEntityData Entity
);

public record WebhookPaymentEntityData(
    string Id,
    string? OrderId,
    string Status,
    string? Method,
    long Amount
);
