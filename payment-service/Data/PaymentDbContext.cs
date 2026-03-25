// ================================================================
// Data/PaymentDbContext.cs — EF Core DB Context
// ================================================================
using Microsoft.EntityFrameworkCore;
using PaymentService.Models;

namespace PaymentService.Data;

public class PaymentDbContext : DbContext
{
    public PaymentDbContext(DbContextOptions<PaymentDbContext> options) : base(options) { }

    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasIndex(e => e.TransactionId).IsUnique();
            entity.HasIndex(e => e.RazorpayOrderId).IsUnique();
            entity.HasIndex(e => e.RazorpayPaymentId).IsUnique();
            entity.HasIndex(e => e.BookingId);
            entity.HasIndex(e => e.Status);
        });
    }
}
