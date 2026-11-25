using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Sniply.Domain;
namespace Sniply.Persistence;

public sealed class SniplyDb(DbContextOptions<SniplyDb> options) : IdentityDbContext<User>(options)
{
    public DbSet<Snippet> Snippets => Set<Snippet>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<Language> Languages => Set<Language>();
    public DbSet<RefreshSession> RefreshSessions => Set<RefreshSession>();
    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.Entity<User>().Property(x => x.Name).HasMaxLength(100);
        b.Entity<Snippet>(e =>
        {
            e.Property(x => x.Title).HasMaxLength(160);
            e.Property(x => x.Description).HasMaxLength(2000);
            e.Property(x => x.Code).HasMaxLength(200000);
            e.HasIndex(x => new { x.UserId, x.UpdatedAt });
            e.HasIndex(x => x.PublicSlug).IsUnique();
            e.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Language).WithMany().HasForeignKey(x => x.LanguageId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(x => x.Groups).WithMany(x => x.Snippets).UsingEntity("SnippetGroups");
        });
        b.Entity<Group>(e => { e.Property(x => x.Kind).HasMaxLength(20); e.Property(x => x.Name).HasMaxLength(60); e.Property(x => x.Description).HasMaxLength(500); e.HasIndex(x => new { x.UserId, x.Kind, x.Name }).IsUnique(); e.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade); });
        b.Entity<Language>(e => { e.Property(x => x.Id).HasMaxLength(50); e.Property(x => x.Name).HasMaxLength(50); e.Property(x => x.MonacoId).HasMaxLength(30); e.HasIndex(x => new { x.UserId, x.Name }).IsUnique(); });
        b.Entity<RefreshSession>(e => { e.HasIndex(x => x.Hash).IsUnique(); e.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade); });
        string[] languages = ["plaintext", "typescript", "javascript", "csharp", "python", "html", "css", "sql", "json", "bash", "go", "rust"];
        b.Entity<Language>().HasData(languages.Select(id => new Language { Id = id, Name = id switch { "csharp" => "C#", "typescript" => "TypeScript", "javascript" => "JavaScript", "plaintext" => "Plain text", _ => char.ToUpperInvariant(id[0]) + id[1..] }, MonacoId = id == "bash" ? "shell" : id }));
    }
}
