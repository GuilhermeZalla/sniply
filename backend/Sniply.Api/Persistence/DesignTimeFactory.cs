using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
namespace Sniply.Persistence;

public sealed class DesignTimeFactory : IDesignTimeDbContextFactory<SniplyDb>
{
    public SniplyDb CreateDbContext(string[] args)
    {
        var connection = Environment.GetEnvironmentVariable("ConnectionStrings__Default") ?? "Host=localhost;Database=sniply;Username=sniply";
        return new SniplyDb(new DbContextOptionsBuilder<SniplyDb>().UseNpgsql(connection).Options);
    }
}
