// ================================================================
// Program.cs — ASP.NET Core 8 Minimal Hosting + DI Wiring
// ================================================================
using Microsoft.EntityFrameworkCore;
using PaymentService.Data;
using PaymentService.Middleware;
using PaymentService.Services;
using Serilog;

// ---- Serilog Bootstrap ----
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder(args);

// ---- Serilog Full Config ----
builder.Host.UseSerilog((ctx, services, config) => config
    .ReadFrom.Configuration(ctx.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext());

// ---- MySQL (EF Core) ----
var connStr = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection string not found");

builder.Services.AddDbContext<PaymentDbContext>(options =>
    options.UseMySql(connStr, ServerVersion.AutoDetect(connStr),
        mySqlOptions => mySqlOptions.EnableRetryOnFailure(3)
    )
);

// ---- HttpClient (for Node.js callbacks) ----
builder.Services.AddHttpClient();

// ---- Application Services ----
builder.Services.AddSingleton<RazorpayService>();
builder.Services.AddScoped<EmailService>();

// ---- ASP.NET ----
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

// ---- Middleware Pipeline ----
app.UseSerilogRequestLogging();

// Internal API key guard (before routing)
app.UseMiddleware<ApiKeyMiddleware>();

app.MapControllers();

Log.Information("🚀 SkyBooker Payment Service starting on {Url}", "http://localhost:7000");

app.Run();
