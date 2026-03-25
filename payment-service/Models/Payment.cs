// ================================================================
// Models/Payment.cs — EF Core Entity
// ================================================================
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PaymentService.Models;

[Table("payments")]
public class Payment
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("booking_id")]
    public int BookingId { get; set; }

    [Column("transaction_id")]
    [MaxLength(50)]
    public string TransactionId { get; set; } = string.Empty;

    [Column("razorpay_order_id")]
    [MaxLength(50)]
    public string? RazorpayOrderId { get; set; }

    [Column("razorpay_payment_id")]
    [MaxLength(50)]
    public string? RazorpayPaymentId { get; set; }

    [Column("razorpay_signature")]
    [MaxLength(255)]
    public string? RazorpaySignature { get; set; }

    [Column("amount", TypeName = "decimal(10,2)")]
    public decimal Amount { get; set; }

    [Column("currency")]
    [MaxLength(3)]
    public string Currency { get; set; } = "INR";

    [Column("payment_method")]
    [MaxLength(30)]
    public string? PaymentMethod { get; set; }

    [Column("status")]
    [MaxLength(20)]
    public string Status { get; set; } = "Created";

    [Column("refund_id")]
    [MaxLength(50)]
    public string? RefundId { get; set; }

    [Column("refund_status")]
    [MaxLength(20)]
    public string? RefundStatus { get; set; }

    [Column("gateway_response", TypeName = "json")]
    public string? GatewayResponse { get; set; }

    [Column("payment_date")]
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
