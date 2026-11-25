using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Sniply.Domain;
using Sniply.Persistence;
namespace Sniply.Application;

public sealed class Accounts(UserManager<User> users, SignInManager<User> signIn, SniplyDb db, IConfiguration config)
{
    public async Task<User> Register(RegisterInput input)
    {
        if (input.Password != input.ConfirmPassword)
            throw new RuleException(400, "Passwords do not match.");
        if (string.IsNullOrWhiteSpace(input.Name))
            throw new RuleException(400, "Name is required.");
        var user = new User { Name = input.Name.Trim(), UserName = input.Email.Trim(), Email = input.Email.Trim() };
        Check(await users.CreateAsync(user, input.Password));
        return user;
    }
    public async Task<object> Login(LoginInput input, HttpResponse response, CancellationToken ct)
    {
        var user = await users.FindByEmailAsync(input.Email.Trim());
        if (user is null)
            throw new RuleException(401, "Email or password is incorrect.");
        var result = await signIn.CheckPasswordSignInAsync(user, input.Password, true);
        if (!result.Succeeded)
            throw new RuleException(401, result.IsLockedOut ? "Too many attempts. Try again later." : "Email or password is incorrect.");
        return await Issue(user, response, input.RememberMe ? 30 : 0, ct);
    }
    public async Task<object> Refresh(HttpRequest request, HttpResponse response, CancellationToken ct)
    {
        var raw = request.Cookies["sniply_refresh"];
        if (string.IsNullOrEmpty(raw))
            throw new RuleException(401, "Please sign in.");
        var hash = Hash(raw);
        var session = await db.RefreshSessions.SingleOrDefaultAsync(x => x.Hash == hash, ct);
        if (session is null || session.ExpiresAt <= DateTime.UtcNow)
            throw new RuleException(401, "Your session has expired. Please sign in.");
        var user = await users.FindByIdAsync(session.UserId) ?? throw new RuleException(401, "Please sign in.");
        var remember = (session.ExpiresAt - DateTime.UtcNow).TotalDays > 1;
        db.RefreshSessions.Remove(session);
        return await Issue(user, response, remember ? 30 : 0, ct);
    }
    public async Task Logout(HttpRequest request, HttpResponse response, CancellationToken ct)
    {
        var hash = Hash(request.Cookies["sniply_refresh"] ?? "");
        var session = await db.RefreshSessions.SingleOrDefaultAsync(x => x.Hash == hash, ct);
        if (session is not null)
        {
            db.RefreshSessions.Remove(session);
            await db.SaveChangesAsync(ct);
        }
        response.Cookies.Delete("sniply_refresh", CookieOptions());
    }
    private async Task<object> Issue(User user, HttpResponse response, int rememberDays, CancellationToken ct)
    {
        var raw = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var expiry = DateTime.UtcNow.AddHours(8);
        if (rememberDays > 0)
            expiry = DateTime.UtcNow.AddDays(rememberDays);
        db.RefreshSessions.Add(new RefreshSession { UserId = user.Id, Hash = Hash(raw), ExpiresAt = expiry });
        var expired = await db.RefreshSessions.Where(x => x.UserId == user.Id && x.ExpiresAt < DateTime.UtcNow).ToListAsync(ct);
        db.RefreshSessions.RemoveRange(expired);
        await db.SaveChangesAsync(ct);
        var cookie = CookieOptions();
        if (rememberDays > 0)
            cookie.Expires = expiry;
        response.Cookies.Append("sniply_refresh", raw, cookie);
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, user.Id), new Claim("stamp", user.SecurityStamp ?? ""), new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()) };
        var token = new JwtSecurityToken(config["Jwt:Issuer"], config["Jwt:Audience"], claims, expires: DateTime.UtcNow.AddMinutes(15), signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!)), SecurityAlgorithms.HmacSha256));
        return new
        {
            AccessToken = new JwtSecurityTokenHandler().WriteToken(token),
            User = View(user)
        };
    }
    private CookieOptions CookieOptions() => new() { HttpOnly = true, Secure = config.GetValue("Cookies:Secure", true), SameSite = SameSiteMode.Strict, Path = "/api/auth" };
    public static object View(User u) => new { u.Id, u.Name, u.Email, u.DefaultLanguage, u.FontSize, u.WordWrap, u.CreatedAt };
    public static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
    public static void Check(IdentityResult result)
    {
        if (!result.Succeeded)
            throw new RuleException(400, string.Join(" ", result.Errors.Select(x => x.Description)));
    }
}
