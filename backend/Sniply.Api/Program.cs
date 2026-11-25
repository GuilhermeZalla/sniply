using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Sniply.Application;
using Sniply.Domain;
using Sniply.Persistence;
var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 1048576);
var key = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(key) || Encoding.UTF8.GetByteCount(key) < 32) throw new InvalidOperationException("Set Jwt__Key to a private random secret of at least 32 bytes.");
var connection = builder.Configuration.GetConnectionString("Default") ?? throw new InvalidOperationException("Set ConnectionStrings__Default for PostgreSQL.");
builder.Services.AddDbContext<SniplyDb>(o => o.UseNpgsql(connection));
builder.Services.AddIdentityCore<User>(o => { o.User.RequireUniqueEmail = true; o.Password.RequiredLength = 10; o.Password.RequireNonAlphanumeric = false; o.Lockout.MaxFailedAccessAttempts = 5; o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(10); }).AddRoles<IdentityRole>().AddEntityFrameworkStores<SniplyDb>().AddSignInManager().AddDefaultTokenProviders();
builder.Services.Configure<DataProtectionTokenProviderOptions>(o => o.TokenLifespan = TimeSpan.FromMinutes(30));
if (!builder.Environment.IsEnvironment("Testing")) { var directory = new DirectoryInfo(Path.GetFullPath(builder.Configuration["DataProtection:Path"] ?? ".keys")); builder.Services.AddDataProtection().PersistKeysToFileSystem(directory).SetApplicationName("Sniply"); }
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
{
    o.MapInboundClaims = false;
    o.TokenValidationParameters = new()
    {
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "sniply",
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "sniply-web",
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
        ClockSkew = TimeSpan.FromSeconds(30),
        NameClaimType = ClaimTypes.NameIdentifier
    };
    o.Events = new JwtBearerEvents { OnTokenValidated = async ctx => { var id = ctx.Principal?.FindFirstValue(ClaimTypes.NameIdentifier); var manager = ctx.HttpContext.RequestServices.GetRequiredService<UserManager<User>>(); var u = id is null ? null : await manager.FindByIdAsync(id); if (u is null || u.SecurityStamp != ctx.Principal?.FindFirstValue("stamp")) ctx.Fail("Session revoked."); } };
});
builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddScoped<Accounts>();
builder.Services.AddScoped<Library>();
builder.Services.AddScoped<ResetMail>();
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.WithOrigins(builder.Configuration["Frontend:Url"] ?? "http://localhost:5173").AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
builder.Services.AddRateLimiter(o => { o.RejectionStatusCode = 429; o.AddPolicy("auth", ctx => RateLimitPartition.GetFixedWindowLimiter(ctx.Connection.RemoteIpAddress?.ToString() ?? "local", _ => new() { PermitLimit = builder.Environment.IsEnvironment("Testing") ? 1000 : 20, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 })); o.AddPolicy("public", ctx => RateLimitPartition.GetFixedWindowLimiter(ctx.Connection.RemoteIpAddress?.ToString() ?? "local", _ => new() { PermitLimit = 60, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 })); });
var app = builder.Build();
app.Use(async (context, next) => { context.Response.Headers["X-Content-Type-Options"] = "nosniff"; context.Response.Headers["Referrer-Policy"] = "same-origin"; context.Response.Headers["Cache-Control"] = "no-store"; try { await next(); } catch (RuleException e) { await Results.Problem(e.Message, statusCode: e.Status).ExecuteAsync(context); } catch (DbUpdateConcurrencyException) { await Results.Problem("The record changed. Refresh and try again.", statusCode: 409).ExecuteAsync(context); } catch (DbUpdateException e) { app.Logger.LogWarning("Database constraint rejected a change ({Type}).", e.GetType().Name); await Results.Problem("This change conflicts with an existing record.", statusCode: 409).ExecuteAsync(context); } catch (Exception e) { app.Logger.LogError(e, "Request failed."); await Results.Problem("The server could not complete the request.", statusCode: 500).ExecuteAsync(context); } });
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/api/health", () => Results.Ok(new { Status = "ok" }));
app.MapControllers();
if (args.Contains("--migrate")) { using var scope = app.Services.CreateScope(); await scope.ServiceProvider.GetRequiredService<SniplyDb>().Database.MigrateAsync(); return; }
app.Run();
public partial class Program
{
}
