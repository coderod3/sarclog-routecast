using Microsoft.EntityFrameworkCore;
using RouteCast.Api.Data.EntityConfigurations;
using RouteCast.Api.Models;

namespace RouteCast.Api.Data;

public class RouteCastDbContext : DbContext
{
    public RouteCastDbContext(DbContextOptions<RouteCastDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Aplicar configurações de entidades
        modelBuilder.ApplyConfiguration(new UserConfiguration());
    }
}
