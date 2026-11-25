using System.ComponentModel.DataAnnotations;
namespace Sniply.Application;

public sealed record RegisterInput([Required, MaxLength(100)] string Name, [Required, EmailAddress, MaxLength(254)] string Email, [Required, MinLength(10), MaxLength(128)] string Password, [Required] string ConfirmPassword);
public sealed record LoginInput([Required, EmailAddress] string Email, [Required] string Password, bool RememberMe = false);
public sealed record ForgotInput([Required, EmailAddress] string Email);
public sealed record ResetInput([Required, EmailAddress] string Email, [Required] string Token, [Required, MinLength(10), MaxLength(128)] string Password, [Required] string ConfirmPassword);
public sealed record SnippetInput([Required, MaxLength(160)] string Title, [MaxLength(2000)] string? Description, [Required, MaxLength(200000)] string Code, [Required, MaxLength(50)] string LanguageId, Guid? CategoryId, Guid[]? GroupIds);
public sealed record GroupInput([Required, MaxLength(60)] string Name, [MaxLength(500)] string? Description);
public sealed record LanguageInput([Required, MaxLength(50)] string Name, [Required, MaxLength(30)] string MonacoId);
public sealed record ProfileInput([Required, MaxLength(100)] string Name, [Required, EmailAddress] string Email, string DefaultLanguage, int FontSize, bool WordWrap, string? CurrentPassword = null);
public sealed record PasswordInput([Required] string CurrentPassword, [Required, MinLength(10), MaxLength(128)] string Password, [Required] string ConfirmPassword);
public sealed record FavoriteInput(bool IsFavorite);
public sealed record ShareInput(bool IsPublic);
public sealed class RuleException(int status, string message) : Exception(message)
{
    public int Status { get; } = status;
}
