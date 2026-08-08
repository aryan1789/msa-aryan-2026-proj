using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using msa_aryan_2026_proj.Api.Data;
using msa_aryan_2026_proj.Api.Models;
using msa_aryan_2026_proj.Api.Services;

namespace msa_aryan_2026_proj.Api.Tests;

// Covers the cross-crew leaderboard aggregation against SQLite in-memory so the
// averaging and ordering run over a real store.
public sealed class ScoreboardServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<AppDbContext> _options;
    private readonly DateOnly _thisWeek = WeekKeys.WeekKeyFor(DateTime.UtcNow);

    public ScoreboardServiceTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        using var ctx = new AppDbContext(_options);
        ctx.Database.EnsureCreated();
    }

    private AppDbContext NewContext() => new(_options);

    private int SeedCrew(string name)
    {
        using var ctx = NewContext();

        var user = new User { Email = $"{name}@b.co", DisplayName = name };
        ctx.Users.Add(user);
        ctx.SaveChanges();

        var crew = new Crew
        {
            Name = name,
            InviteCode = name.ToUpperInvariant(),
            DefaultWeeklyTarget = 1,
            CreatedByUserId = user.Id
        };
        ctx.Crews.Add(crew);
        ctx.SaveChanges();

        return crew.Id;
    }

    // Adds a member to a crew whose current streak is `streak` consecutive met
    // weeks ending this week, and returns nothing.
    private void SeedMemberWithStreak(int crewId, string display, int streak)
    {
        using var ctx = NewContext();

        var user = new User { Email = $"{display}@b.co", DisplayName = display };
        ctx.Users.Add(user);
        ctx.SaveChanges();

        var membership = new CrewMembership
        {
            CrewId = crewId,
            UserId = user.Id,
            WeeklyTarget = 1
        };
        ctx.CrewMemberships.Add(membership);
        ctx.SaveChanges();

        for (var i = 0; i < streak; i++)
        {
            ctx.WeeklyResults.Add(new WeeklyResult
            {
                MembershipId = membership.Id,
                WeekKey = _thisWeek.AddDays(-7 * i),
                CheckInCount = 1,
                TargetMet = true
            });
        }
        ctx.SaveChanges();
    }

    [Fact]
    public async Task Leaderboard_RanksCrewsByAverageStreakDescending()
    {
        var alpha = SeedCrew("Alpha");
        SeedMemberWithStreak(alpha, "A1", streak: 2);
        SeedMemberWithStreak(alpha, "A2", streak: 0);

        var bravo = SeedCrew("Bravo");
        SeedMemberWithStreak(bravo, "B1", streak: 3);

        using var ctx = NewContext();
        var service = new ScoreboardService(ctx);

        var rows = await service.BuildCrewLeaderboardAsync();

        Assert.Equal(2, rows.Count);
        Assert.Equal("Bravo", rows[0].Name);
        Assert.Equal(3.0, rows[0].AverageStreak);
        Assert.Equal(1, rows[0].MemberCount);
        Assert.Equal("Alpha", rows[1].Name);
        Assert.Equal(1.0, rows[1].AverageStreak);
        Assert.Equal(2, rows[1].MemberCount);
    }

    public void Dispose() => _connection.Dispose();
}
