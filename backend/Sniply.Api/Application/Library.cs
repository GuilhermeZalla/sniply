using Microsoft.EntityFrameworkCore;
using Sniply.Domain;
using Sniply.Persistence;
namespace Sniply.Application;

public sealed class Library(SniplyDb db)
{
    public IQueryable<Snippet> Owned(string userId) => db.Snippets.Where(x => x.UserId == userId);
    public async Task<Snippet> Find(string userId, Guid id, CancellationToken ct) => await Owned(userId).Include(x => x.Language).Include(x => x.Category).Include(x => x.Groups).SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RuleException(404, "Snippet not found.");
    public static object View(Snippet x, bool detail = false) => new { x.Id, x.Title, x.Description, Code = detail ? x.Code : null, x.LanguageId, Language = x.Language.Name, MonacoId = x.Language.MonacoId, x.CategoryId, Category = x.Category?.Name, x.IsFavorite, IsPublic = x.PublicSlug != null, x.PublicSlug, x.CreatedAt, x.UpdatedAt, Groups = x.Groups.OrderBy(g => g.Name).Select(g => new { g.Id, g.Name, g.Kind }) };
    public async Task<object> List(string userId, string? search, string? language, Guid? category, Guid? group, bool favorite, string? sort, int page, int pageSize, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var q = Owned(userId).AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            q = q.Where(x => x.Title.ToLower().Contains(term) || x.Description.ToLower().Contains(term) || x.Code.ToLower().Contains(term) || x.Language.Name.ToLower().Contains(term) || x.Groups.Any(g => g.Kind == "tag" && g.Name.ToLower().Contains(term)));
        }
        if (!string.IsNullOrEmpty(language))
            q = q.Where(x => x.LanguageId == language);
        if (category.HasValue)
            q = q.Where(x => x.CategoryId == category);
        if (group.HasValue)
            q = q.Where(x => x.Groups.Any(g => g.Id == group));
        if (favorite)
            q = q.Where(x => x.IsFavorite);
        var total = await q.CountAsync(ct);
        var pages = Math.Max(1, (int)Math.Ceiling(total / (double)pageSize));
        page = Math.Min(page, pages);
        q = sort switch
        {
            "created" => q.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id),
            "title" => q.OrderBy(x => x.Title).ThenBy(x => x.Id),
            _ => q.OrderByDescending(x => x.UpdatedAt).ThenBy(x => x.Id)
        };
        var rows = await q.Include(x => x.Language).Include(x => x.Category).Include(x => x.Groups).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new
        {
            Items = rows.Select(x => View(x)),
            Total = total,
            Page = page,
            PageSize = pageSize,
            Pages = pages
        };
    }
    public async Task<Snippet> Save(string userId, Guid? id, SnippetInput input, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(input.Title) || string.IsNullOrWhiteSpace(input.Code))
            throw new RuleException(400, "Title and code are required.");
        var lang = await db.Languages.SingleOrDefaultAsync(x => x.Id == input.LanguageId && (x.UserId == null || x.UserId == userId), ct) ?? throw new RuleException(400, "Choose an available language.");
        Group? category = null;
        if (input.CategoryId.HasValue)
            category = await db.Groups.SingleOrDefaultAsync(x => x.Id == input.CategoryId && x.UserId == userId && x.Kind == "category", ct) ?? throw new RuleException(400, "Choose one of your categories.");
        var ids = (input.GroupIds ?? []).Distinct().ToArray();
        var groups = await db.Groups.Where(x => ids.Contains(x.Id) && x.UserId == userId && (x.Kind == "tag" || x.Kind == "collection")).ToListAsync(ct);
        if (groups.Count != ids.Length)
            throw new RuleException(400, "Choose only your own tags and collections.");
        var snippet = id.HasValue ? await Find(userId, id.Value, ct) : new Snippet { UserId = userId };
        snippet.Title = input.Title.Trim();
        snippet.Description = input.Description?.Trim() ?? "";
        snippet.Code = input.Code;
        snippet.Language = lang;
        snippet.LanguageId = lang.Id;
        snippet.Category = category;
        snippet.CategoryId = category?.Id;
        foreach (var item in snippet.Groups.Concat(groups))
            item.UpdatedAt = DateTime.UtcNow;
        snippet.Groups.Clear();
        foreach (var item in groups)
            snippet.Groups.Add(item);
        snippet.UpdatedAt = DateTime.UtcNow;
        if (!id.HasValue)
            db.Snippets.Add(snippet);
        await db.SaveChangesAsync(ct);
        return snippet;
    }
    public async Task<object> Stats(string userId, CancellationToken ct)
    {
        var owned = Owned(userId);
        var total = await owned.CountAsync(ct);
        var favorites = await owned.CountAsync(x => x.IsFavorite, ct);
        var collections = await db.Groups.CountAsync(x => x.UserId == userId && x.Kind == "collection", ct);
        var languages = await owned.GroupBy(x => new { x.LanguageId, x.Language.Name }).Select(g => new { Id = g.Key.LanguageId, g.Key.Name, Count = g.Count() }).OrderByDescending(x => x.Count).ToListAsync(ct);
        var recent = await owned.Include(x => x.Language).Include(x => x.Category).Include(x => x.Groups).OrderByDescending(x => x.UpdatedAt).Take(5).ToListAsync(ct);
        var added = await owned.Include(x => x.Language).Include(x => x.Category).Include(x => x.Groups).OrderByDescending(x => x.CreatedAt).Take(3).ToListAsync(ct);
        return new
        {
            Total = total,
            Favorites = favorites,
            Collections = collections,
            Languages = languages,
            Recent = recent.Select(x => View(x)),
            Added = added.Select(x => View(x))
        };
    }
}
