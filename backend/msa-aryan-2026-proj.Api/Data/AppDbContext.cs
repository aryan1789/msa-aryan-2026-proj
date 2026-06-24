using Microsoft.EntityFrameworkCore;
using msa_aryan_2026_proj.Api.Models;

namespace msa_aryan_2026_proj.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
}