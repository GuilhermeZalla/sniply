using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Sniply.Application;
using Sniply.Domain;
using Sniply.Persistence;
namespace Sniply.Api;

[ApiController, Authorize, Route("api")]
public sealed class LibraryController(Library library, SniplyDb db) : ControllerBase
{
    private string Owner => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    [HttpGet("snippets")] public async Task<IActionResult> List(string? search, string? language, Guid? category, Guid? group, bool favorite = false, string? sort = null, int page = 1, int pageSize = 15, CancellationToken ct = default) => Ok(await library.List(Owner, search, language, category, group, favorite, sort, page, pageSize, ct));
    [HttpGet("snippets/{id:guid}")] public async Task<IActionResult> Detail(Guid id, CancellationToken ct) => Ok(Library.View(await library.Find(Owner, id, ct), true));
    [HttpPost("snippets")]
    public async Task<IActionResult> Create(SnippetInput input, CancellationToken ct)
    {
        var s = await library.Save(Owner, null, input, ct);
        return Created($"/api/snippets/{s.Id}", Library.View(s, true));
    }
    [HttpPut("snippets/{id:guid}")] public async Task<IActionResult> Update(Guid id, SnippetInput input, CancellationToken ct) => Ok(Library.View(await library.Save(Owner, id, input, ct), true));
    [HttpDelete("snippets/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        db.Snippets.Remove(await library.Find(Owner, id, ct));
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
    [HttpPut("snippets/{id:guid}/favorite")]
    public async Task<IActionResult> Favorite(Guid id, FavoriteInput input, CancellationToken ct)
    {
        var s = await library.Find(Owner, id, ct);
        s.IsFavorite = input.IsFavorite;
        await db.SaveChangesAsync(ct);
        return Ok(Library.View(s, true));
    }
    [HttpPut("snippets/{id:guid}/share")]
    public async Task<IActionResult> Share(Guid id, ShareInput input, CancellationToken ct)
    {
        var s = await library.Find(Owner, id, ct);
        s.PublicSlug = input.IsPublic ? s.PublicSlug ?? Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant() : null;
        await db.SaveChangesAsync(ct);
        return Ok(new
        {
            s.PublicSlug
        });
    }
    [AllowAnonymous, EnableRateLimiting("public"), HttpGet("public/{slug}")]
    public async Task<IActionResult> Public(string slug, CancellationToken ct)
    {
        if (slug.Length != 48)
            return NotFound();
        var s = await db.Snippets.AsNoTracking().Include(x => x.Language).SingleOrDefaultAsync(x => x.PublicSlug == slug, ct);
        return s is null ? NotFound() : Ok(new
        {
            s.Title,
            s.Description,
            s.Code,
            Language = s.Language.Name,
            MonacoId = s.Language.MonacoId
        });
    }
    [HttpGet("overview")] public async Task<IActionResult> Stats(CancellationToken ct) => Ok(await library.Stats(Owner, ct));
    [HttpGet("groups/{kind}")]
    public async Task<IActionResult> Groups(string kind, CancellationToken ct)
    {
        Kind(kind);
        return Ok(await db.Groups.Where(x => x.UserId == Owner && x.Kind == kind).OrderBy(x => x.Name).Select(x => new { x.Id, x.Name, x.Description, x.Kind, x.UpdatedAt, Count = kind == "category" ? db.Snippets.Count(s => s.CategoryId == x.Id) : x.Snippets.Count }).ToListAsync(ct));
    }
    [HttpPost("groups/{kind}")]
    public async Task<IActionResult> CreateGroup(string kind, GroupInput input, CancellationToken ct)
    {
        Kind(kind);
        if (string.IsNullOrWhiteSpace(input.Name))
            throw new RuleException(400, "A name is required.");
        var x = new Group { UserId = Owner, Kind = kind, Name = input.Name.Trim(), Description = input.Description?.Trim() ?? "" };
        if (await db.Groups.AnyAsync(g => g.UserId == Owner && g.Kind == kind && g.Name == x.Name, ct))
            throw new RuleException(409, "A group with that name already exists.");
        db.Groups.Add(x);
        await db.SaveChangesAsync(ct);
        return StatusCode(201, new
        {
            x.Id,
            x.Name,
            x.Description,
            x.Kind,
            Count = 0
        });
    }
    [HttpPut("groups/{kind}/{id:guid}")]
    public async Task<IActionResult> RenameGroup(string kind, Guid id, GroupInput input, CancellationToken ct)
    {
        Kind(kind);
        var x = await db.Groups.SingleOrDefaultAsync(g => g.Id == id && g.UserId == Owner && g.Kind == kind, ct) ?? throw new RuleException(404, "Group not found.");
        if (string.IsNullOrWhiteSpace(input.Name))
            throw new RuleException(400, "A name is required.");
        if (await db.Groups.AnyAsync(g => g.UserId == Owner && g.Kind == kind && g.Name == input.Name.Trim() && g.Id != id, ct))
            throw new RuleException(409, "A group with that name already exists.");
        x.Name = input.Name.Trim();
        x.Description = input.Description?.Trim() ?? "";
        x.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
    [HttpDelete("groups/{kind}/{id:guid}")]
    public async Task<IActionResult> DeleteGroup(string kind, Guid id, CancellationToken ct)
    {
        Kind(kind);
        var x = await db.Groups.SingleOrDefaultAsync(g => g.Id == id && g.UserId == Owner && g.Kind == kind, ct) ?? throw new RuleException(404, "Group not found.");
        db.Groups.Remove(x);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
    [HttpGet("languages")] public async Task<IActionResult> Languages(CancellationToken ct) => Ok(await db.Languages.Where(x => x.UserId == null || x.UserId == Owner).OrderBy(x => x.Name).Select(x => new { x.Id, x.Name, x.MonacoId, Custom = x.UserId != null }).ToListAsync(ct));
    [HttpPost("languages")]
    public async Task<IActionResult> AddLanguage(LanguageInput input, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(input.Name) || !System.Text.RegularExpressions.Regex.IsMatch(input.MonacoId, "^[a-z][a-z0-9-]{0,29}$"))
            throw new RuleException(400, "Choose a name and a valid Monaco language identifier.");
        var x = new Language { Id = Guid.NewGuid().ToString("N"), Name = input.Name.Trim(), MonacoId = input.MonacoId, UserId = Owner };
        if (await db.Languages.AnyAsync(g => g.Name == x.Name && (g.UserId == null || g.UserId == Owner), ct))
            throw new RuleException(409, "That language already exists.");
        db.Languages.Add(x);
        await db.SaveChangesAsync(ct);
        return StatusCode(201, x);
    }
    [HttpDelete("languages/{id}")]
    public async Task<IActionResult> DeleteLanguage(string id, CancellationToken ct)
    {
        var x = await db.Languages.SingleOrDefaultAsync(x => x.Id == id && x.UserId == Owner, ct) ?? throw new RuleException(404, "Custom language not found.");
        if (await db.Snippets.AnyAsync(s => s.LanguageId == id, ct))
            throw new RuleException(409, "Move the snippets to another language before removing this language.");
        db.Languages.Remove(x);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
    private static void Kind(string kind)
    {
        if (kind is not ("tag" or "collection" or "category"))
            throw new RuleException(404, "Group type not found.");
    }
}
