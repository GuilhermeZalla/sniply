using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Sniply.Application;
using Sniply.Domain;
using Sniply.Persistence;
namespace Sniply.Api;

[ApiController, Route("api/auth"), EnableRateLimiting("auth")]
public sealed class AuthController(Accounts accounts, UserManager<User> users, SniplyDb db, ResetMail mail, IConfiguration config, ILogger<AuthController> log) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterInput input)
    {
        await accounts.Register(input);
        return StatusCode(201, new
        {
            Message = "Account created. Sign in to start your library."
        });
    }
    [HttpPost("login")] public async Task<IActionResult> Login(LoginInput input, CancellationToken ct) => Ok(await accounts.Login(input, Response, ct));
    [HttpPost("refresh")] public async Task<IActionResult> Refresh(CancellationToken ct) => Ok(await accounts.Refresh(Request, Response, ct));
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        await accounts.Logout(Request, Response, ct);
        return NoContent();
    }
    [Authorize, HttpGet("me")] public async Task<IActionResult> Me() => Ok(Accounts.View(await Current()));
    [HttpPost("forgot-password")]
    public async Task<IActionResult> Forgot(ForgotInput input, CancellationToken ct)
    {
        var user = await users.FindByEmailAsync(input.Email.Trim());
        if (user is not null)
        {
            var token = await users.GeneratePasswordResetTokenAsync(user);
            var url = (config["Frontend:Url"] ?? "http://localhost:5173") + "/reset-password?email=" + Uri.EscapeDataString(input.Email) + "&token=" + Uri.EscapeDataString(token);
            try
            {
                await mail.Send(input.Email, url, ct);
            }
            catch (Exception e) when (e is not OperationCanceledException) { log.LogError("Password recovery delivery failed ({ErrorType}).", e.GetType().Name); }
        }
        return Ok(new
        {
            Message = "If an account exists for that email, a reset link will be sent."
        });
    }
    [HttpPost("reset-password")]
    public async Task<IActionResult> Reset(ResetInput input, CancellationToken ct)
    {
        if (input.Password != input.ConfirmPassword)
            throw new RuleException(400, "Passwords do not match.");
        var user = await users.FindByEmailAsync(input.Email.Trim()) ?? throw new RuleException(400, "This reset link is invalid or expired.");
        var result = await users.ResetPasswordAsync(user, input.Token, input.Password);
        if (!result.Succeeded)
            throw new RuleException(400, "This reset link is invalid/expired, or the password does not meet the requirements.");
        db.RefreshSessions.RemoveRange(await db.RefreshSessions.Where(x => x.UserId == user.Id).ToListAsync(ct));
        await db.SaveChangesAsync(ct);
        return Ok(new
        {
            Message = "Password reset. Sign in with your new password."
        });
    }
    [Authorize, HttpPut("profile")]
    public async Task<IActionResult> Profile(ProfileInput input)
    {
        var user = await Current();
        if (!string.Equals(user.Email, input.Email, StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrEmpty(input.CurrentPassword) || !await users.CheckPasswordAsync(user, input.CurrentPassword))
                throw new RuleException(400, "Enter your current password to change your email.");
            user.Email = input.Email.Trim();
            user.UserName = input.Email.Trim();
        }
        if (string.IsNullOrWhiteSpace(input.Name) || input.FontSize < 12 || input.FontSize > 22)
            throw new RuleException(400, "Choose a name and an editor font size between 12 and 22.");
        if (!await db.Languages.AnyAsync(x => x.Id == input.DefaultLanguage && (x.UserId == null || x.UserId == user.Id)))
            throw new RuleException(400, "Choose an available default language.");
        user.Name = input.Name.Trim();
        user.DefaultLanguage = input.DefaultLanguage;
        user.FontSize = input.FontSize;
        user.WordWrap = input.WordWrap;
        Accounts.Check(await users.UpdateAsync(user));
        return Ok(Accounts.View(user));
    }
    [Authorize, HttpPut("password")]
    public async Task<IActionResult> Password(PasswordInput input, CancellationToken ct)
    {
        var user = await Current();
        if (input.Password != input.ConfirmPassword)
            throw new RuleException(400, "Passwords do not match.");
        Accounts.Check(await users.ChangePasswordAsync(user, input.CurrentPassword, input.Password));
        db.RefreshSessions.RemoveRange(await db.RefreshSessions.Where(x => x.UserId == user.Id).ToListAsync(ct));
        await db.SaveChangesAsync(ct);
        await accounts.Logout(Request, Response, ct);
        return Ok(new
        {
            Message = "Password changed. Sign in again."
        });
    }
    private async Task<User> Current() => await users.FindByIdAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!) ?? throw new RuleException(401, "Please sign in.");
}
