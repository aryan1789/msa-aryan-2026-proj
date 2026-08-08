using Microsoft.EntityFrameworkCore;
using msa_aryan_2026_proj.Api.Models;

namespace msa_aryan_2026_proj.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Crew> Crews => Set<Crew>();
    public DbSet<CrewMembership> CrewMemberships => Set<CrewMembership>();
    public DbSet<CheckIn> CheckIns => Set<CheckIn>();
    public DbSet<WeeklyResult> WeeklyResults => Set<WeeklyResult>();
    public DbSet<Achievement> Achievements => Set<Achievement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .Property(user => user.Email)
            .HasMaxLength(256);

        modelBuilder.Entity<User>()
            .Property(user => user.DisplayName)
            .HasMaxLength(100);

        modelBuilder.Entity<User>()
            .HasIndex(user => user.Email)
            .IsUnique();

        modelBuilder.Entity<Crew>()
            .Property(crew => crew.Name)
            .HasMaxLength(100);

        modelBuilder.Entity<Crew>()
            .Property(crew => crew.InviteCode)
            .HasMaxLength(32);

        modelBuilder.Entity<Crew>()
            .HasIndex(crew => crew.InviteCode)
            .IsUnique();

        modelBuilder.Entity<CrewMembership>()
            .HasIndex(membership => new { membership.CrewId, membership.UserId })
            .IsUnique();

        // Membership → Crew: deleting a crew removes its memberships.
        modelBuilder.Entity<CrewMembership>()
            .HasOne(membership => membership.Crew)
            .WithMany(crew => crew.Memberships)
            .HasForeignKey(membership => membership.CrewId)
            .OnDelete(DeleteBehavior.Cascade);

        // Membership → User: deleting a user removes their memberships.
        modelBuilder.Entity<CrewMembership>()
            .HasOne(membership => membership.User)
            .WithMany(user => user.Memberships)
            .HasForeignKey(membership => membership.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Crew → creator (User): Restrict so a user can't be deleted while they
        // own crews. This also breaks the multi-cascade-path cycle through User.
        modelBuilder.Entity<Crew>()
            .HasOne(crew => crew.CreatedBy)
            .WithMany()
            .HasForeignKey(crew => crew.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CheckIn>()
            .Property(checkIn => checkIn.Note)
            .HasMaxLength(500);

        // Supports the core query: check-ins for a membership within a week.
        // Non-unique because multiple check-ins per week are expected.
        modelBuilder.Entity<CheckIn>()
            .HasIndex(checkIn => new { checkIn.MembershipId, checkIn.WeekKey });

        modelBuilder.Entity<CheckIn>()
            .HasIndex(checkIn => new { checkIn.MembershipId, checkIn.DayKey })
            .IsUnique();

        // CheckIn → CrewMembership: deleting a membership removes its check-ins.
        modelBuilder.Entity<CheckIn>()
            .HasOne(checkIn => checkIn.Membership)
            .WithMany(membership => membership.CheckIns)
            .HasForeignKey(checkIn => checkIn.MembershipId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WeeklyResult>()
            .HasIndex(result => new { result.MembershipId, result.WeekKey })
            .IsUnique();

        modelBuilder.Entity<WeeklyResult>()
            .HasOne(result => result.Membership)
            .WithMany(membership => membership.WeeklyResults)
            .HasForeignKey(result => result.MembershipId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Achievement>()
            .Property(achievement => achievement.Code)
            .HasMaxLength(50);

        // A membership earns each badge at most once.
        modelBuilder.Entity<Achievement>()
            .HasIndex(achievement => new { achievement.MembershipId, achievement.Code })
            .IsUnique();

        modelBuilder.Entity<Achievement>()
            .HasOne(achievement => achievement.Membership)
            .WithMany(membership => membership.Achievements)
            .HasForeignKey(achievement => achievement.MembershipId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}