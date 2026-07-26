using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using msa_aryan_2026_proj.Api.Data;
using msa_aryan_2026_proj.Api.Models;
using msa_aryan_2026_proj.Api.Services;

namespace msa_aryan_2026_proj.Api.Tests;

// Exercises the ScoringService XP/tally logic against a real relational store
// (SQLite in-memory) so FK and index behaviour is enforced. The Postgres-only
// unique-violation retry and duplicate-check-in branches are intentionally not
// covered here — they throw PostgresException, which SQLite cannot reproduce,
// and are covered by the end-to-end run instead.
public sealed class ScoringServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<AppDbContext> _options;

    public ScoringServiceTests()
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

    // Seeds the User → Crew → CrewMembership chain the FK constraints require
    // and returns the membership id.
    private int SeedMembership(int weeklyTarget, int xp = 0)
    {
        using var ctx = NewContext();

        var user = new User { Email = "a@b.co", DisplayName = "A" };
        ctx.Users.Add(user);
        ctx.SaveChanges();

        var crew = new Crew
        {
            Name = "Crew",
            InviteCode = "CODE",
            DefaultWeeklyTarget = weeklyTarget,
            CreatedByUserId = user.Id
        };
        ctx.Crews.Add(crew);
        ctx.SaveChanges();

        var membership = new CrewMembership
        {
            CrewId = crew.Id,
            UserId = user.Id,
            WeeklyTarget = weeklyTarget,
            Xp = xp
        };
        ctx.CrewMemberships.Add(membership);
        ctx.SaveChanges();

        return membership.Id;
    }

    private void SeedWeeklyResult(int membershipId, DateOnly week, int count, bool targetMet)
    {
        using var ctx = NewContext();
        ctx.WeeklyResults.Add(new WeeklyResult
        {
            MembershipId = membershipId,
            WeekKey = week,
            CheckInCount = count,
            TargetMet = targetMet
        });
        ctx.SaveChanges();
    }

    private int SeedCheckIn(int membershipId, DateOnly week, DateOnly day)
    {
        using var ctx = NewContext();
        var checkIn = new CheckIn
        {
            MembershipId = membershipId,
            OccurredAt = DateTime.UtcNow,
            WeekKey = week,
            DayKey = day,
            Note = "seed"
        };
        ctx.CheckIns.Add(checkIn);
        ctx.SaveChanges();
        return checkIn.Id;
    }

    // ---- RecordCheckInAsync ----

    [Fact]
    public async Task RecordCheckIn_FreshWeek_AwardsBaseXpAndTalliesOne()
    {
        var membershipId = SeedMembership(weeklyTarget: 3);

        using var ctx = NewContext();
        var membership = await ctx.CrewMemberships.FirstAsync(m => m.Id == membershipId);
        var service = new ScoringService(ctx);

        var result = await service.RecordCheckInAsync(membership, "first");

        Assert.Equal(1, result.CheckInCount);
        Assert.Equal(10, result.Xp);
        Assert.False(result.TargetMet);
        Assert.False(result.JustMet);

        var weekly = await ctx.WeeklyResults.SingleAsync(w => w.MembershipId == membershipId);
        Assert.Equal(1, weekly.CheckInCount);
    }

    [Fact]
    public async Task RecordCheckIn_BelowTarget_AwardsTenAndNoBonus()
    {
        var membershipId = SeedMembership(weeklyTarget: 3, xp: 10);
        var week = WeekKeys.WeekKeyFor(DateTime.UtcNow);
        SeedWeeklyResult(membershipId, week, count: 1, targetMet: false);

        using var ctx = NewContext();
        var membership = await ctx.CrewMemberships.FirstAsync(m => m.Id == membershipId);
        var service = new ScoringService(ctx);

        var result = await service.RecordCheckInAsync(membership, "second");

        Assert.Equal(2, result.CheckInCount);
        Assert.False(result.JustMet);
        Assert.False(result.TargetMet);
        Assert.Equal(20, result.Xp); // 10 + 10, no bonus
    }

    [Fact]
    public async Task RecordCheckIn_CrossesTarget_PaysBonusExactlyOnce()
    {
        var membershipId = SeedMembership(weeklyTarget: 3, xp: 20);
        var week = WeekKeys.WeekKeyFor(DateTime.UtcNow);
        SeedWeeklyResult(membershipId, week, count: 2, targetMet: false);

        using var ctx = NewContext();
        var membership = await ctx.CrewMemberships.FirstAsync(m => m.Id == membershipId);
        var service = new ScoringService(ctx);

        var result = await service.RecordCheckInAsync(membership, "third");

        Assert.Equal(3, result.CheckInCount);
        Assert.True(result.TargetMet);
        Assert.True(result.JustMet);
        Assert.Equal(80, result.Xp); // 20 + 10 base + 50 bonus
    }

    [Fact]
    public async Task RecordCheckIn_AfterTargetAlreadyMet_PaysNoSecondBonus()
    {
        var membershipId = SeedMembership(weeklyTarget: 3, xp: 80);
        var week = WeekKeys.WeekKeyFor(DateTime.UtcNow);
        SeedWeeklyResult(membershipId, week, count: 3, targetMet: true);

        using var ctx = NewContext();
        var membership = await ctx.CrewMemberships.FirstAsync(m => m.Id == membershipId);
        var service = new ScoringService(ctx);

        var result = await service.RecordCheckInAsync(membership, "fourth");

        Assert.Equal(4, result.CheckInCount);
        Assert.True(result.TargetMet);
        Assert.False(result.JustMet);
        Assert.Equal(90, result.Xp); // 80 + 10 base only
    }

    // ---- ReverseCheckInAsync ----

    private static readonly DateOnly ReverseWeek = new(2026, 7, 13);

    [Fact]
    public async Task ReverseCheckIn_BelowThreshold_ClawsBackTen()
    {
        var membershipId = SeedMembership(weeklyTarget: 3, xp: 10);
        SeedWeeklyResult(membershipId, ReverseWeek, count: 1, targetMet: false);
        var checkInId = SeedCheckIn(membershipId, ReverseWeek, new DateOnly(2026, 7, 14));

        using var ctx = NewContext();
        var membership = await ctx.CrewMemberships.FirstAsync(m => m.Id == membershipId);
        var checkIn = await ctx.CheckIns.FirstAsync(c => c.Id == checkInId);
        var service = new ScoringService(ctx);

        await service.ReverseCheckInAsync(membership, checkIn);

        Assert.Equal(0, membership.Xp);
        var weekly = await ctx.WeeklyResults.SingleAsync(w => w.MembershipId == membershipId);
        Assert.Equal(0, weekly.CheckInCount);
        Assert.False(weekly.TargetMet);
        Assert.False(await ctx.CheckIns.AnyAsync(c => c.Id == checkInId));
    }

    [Fact]
    public async Task ReverseCheckIn_DropsMetWeekBelowTarget_ClawsBackSixty()
    {
        var membershipId = SeedMembership(weeklyTarget: 3, xp: 60);
        SeedWeeklyResult(membershipId, ReverseWeek, count: 3, targetMet: true);
        var checkInId = SeedCheckIn(membershipId, ReverseWeek, new DateOnly(2026, 7, 15));

        using var ctx = NewContext();
        var membership = await ctx.CrewMemberships.FirstAsync(m => m.Id == membershipId);
        var checkIn = await ctx.CheckIns.FirstAsync(c => c.Id == checkInId);
        var service = new ScoringService(ctx);

        await service.ReverseCheckInAsync(membership, checkIn);

        Assert.Equal(0, membership.Xp); // -10 base, -50 for dropping below target
        var weekly = await ctx.WeeklyResults.SingleAsync(w => w.MembershipId == membershipId);
        Assert.Equal(2, weekly.CheckInCount);
        Assert.False(weekly.TargetMet);
    }

    [Fact]
    public async Task ReverseCheckIn_StaysAtOrAboveTarget_ClawsBackOnlyTen()
    {
        var membershipId = SeedMembership(weeklyTarget: 3, xp: 100);
        SeedWeeklyResult(membershipId, ReverseWeek, count: 4, targetMet: true);
        var checkInId = SeedCheckIn(membershipId, ReverseWeek, new DateOnly(2026, 7, 16));

        using var ctx = NewContext();
        var membership = await ctx.CrewMemberships.FirstAsync(m => m.Id == membershipId);
        var checkIn = await ctx.CheckIns.FirstAsync(c => c.Id == checkInId);
        var service = new ScoringService(ctx);

        await service.ReverseCheckInAsync(membership, checkIn);

        Assert.Equal(90, membership.Xp); // only -10, week is still met at 3
        var weekly = await ctx.WeeklyResults.SingleAsync(w => w.MembershipId == membershipId);
        Assert.Equal(3, weekly.CheckInCount);
        Assert.True(weekly.TargetMet);
    }

    public void Dispose() => _connection.Dispose();
}
