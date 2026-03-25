// ================================================================
// Middleware/ApiKeyMiddleware.cs — Internal API Key Guard
// Protects all /api/payments/* and /api/webhooks/* from external callers.
// Razorpay webhooks are authenticated via signature — bypass X-Api-Key for them.
// ================================================================
namespace PaymentService.Middleware;

public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string _apiKey;

    public ApiKeyMiddleware(RequestDelegate next, IConfiguration config)
    {
        _next   = next;
        _apiKey = config["InternalApiKey"] ?? throw new InvalidOperationException("InternalApiKey not configured");
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";

        // Razorpay webhooks: skip API key check (authenticated by signature in controller)
        if (path.StartsWith("/api/webhooks/razorpay", StringComparison.OrdinalIgnoreCase) ||
            path.Equals("/health", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        // All other routes: require X-Api-Key header
        if (!context.Request.Headers.TryGetValue("X-Api-Key", out var key) || key != _apiKey)
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new { error = "Unauthorized — invalid or missing API key" });
            return;
        }

        await _next(context);
    }
}
