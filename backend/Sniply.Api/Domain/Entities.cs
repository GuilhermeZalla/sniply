using Microsoft.AspNetCore.Identity;
namespace Sniply.Domain;

public sealed class User : IdentityUser
{
    public string Name { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string DefaultLanguage { get; set; } = "typescript";
    public int FontSize { get; set; } = 14;
    public bool WordWrap { get; set; } = true;
}
public sealed class Language
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string MonacoId { get; set; } = "plaintext";
    public string? UserId
    {
        get; set;
    }
}
public sealed class Group
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = "";
    public string Kind { get; set; } = "tag";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Snippet> Snippets { get; set; } = new List<Snippet>();
}
public sealed class Snippet
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Code { get; set; } = "";
    public string LanguageId { get; set; } = "plaintext";
    public Language Language { get; set; } = null!;
    public Guid? CategoryId
    {
        get; set;
    }
    public Group? Category
    {
        get; set;
    }
    public bool IsFavorite
    {
        get; set;
    }
    public string? PublicSlug
    {
        get; set;
    }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Group> Groups { get; set; } = new List<Group>();
}
public sealed class RefreshSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = "";
    public string Hash { get; set; } = "";
    public DateTime ExpiresAt
    {
        get; set;
    }
}
