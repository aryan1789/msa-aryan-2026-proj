using Microsoft.EntityFrameworkCore;
using msa_aryan_2026_proj.Api.Data;
using msa_aryan_2026_proj.Api.Models;

namespace msa_aryan_2026_proj.Api.Services;

public class ScoreboardService : IScoreboardService
{
    private readonly AppDbContext _db;

    public ScoreboardService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<ScoreboardRow>?> BuildCrewAsync(int crewId, int requestingUserId)
    {
        var thisWeek = WeekKeys.WeekKeyFor(DateTime.UtcNow);

        var members = await _db.CrewMemberships
            .AsNoTracking()
            .Where(m => m.CrewId == crewId)
            .Select(m => new MemberCore(m.Id, m.UserId, m.User.DisplayName, m.Xp, m.WeeklyTarget))
            .ToListAsync();

        if (!members.Any(m => m.UserId == requestingUserId))
        {
            return null;
        }

        var membershipIds = members.Select(m => m.Id).ToList();

        var thisWeekResults = await _db.WeeklyResults
            .AsNoTracking()
            .Where(w => membershipIds.Contains(w.MembershipId) && w.WeekKey == thisWeek)
            .ToDictionaryAsync(w => w.MembershipId, w => new WeekProgress(w.CheckInCount, w.TargetMet));

        var metWeeks = await _db.WeeklyResults
            .AsNoTracking()
            .Where(w => membershipIds.Contains(w.MembershipId) && w.TargetMet)
            .Select(w => new { w.MembershipId, w.WeekKey })
            .ToListAsync();

        var metByMembership = metWeeks
            .GroupBy(w => w.MembershipId)
            .ToDictionary(g => g.Key, g => g.Select(w => w.WeekKey).ToHashSet());

        var badges = await _db.Achievements
            .AsNoTracking()
            .Where(a => membershipIds.Contains(a.MembershipId))
            .Select(a => new { a.MembershipId, a.Code })
            .ToListAsync();

        var badgesByMembership = badges
            .GroupBy(a => a.MembershipId)
            .ToDictionary(g => g.Key, g => g.Select(a => a.Code).ToList());

        return members
            .Select(m => BuildRow(
                m.UserId,
                m.DisplayName,
                m.Xp,
                m.WeeklyTarget,
                thisWeekResults.GetValueOrDefault(m.Id),
                metByMembership.GetValueOrDefault(m.Id),
                thisWeek,
                badgesByMembership.GetValueOrDefault(m.Id)))
            .OrderByDescending(r => r.Xp)
            .ThenByDescending(r => r.CurrentStreak)
            .ToList();
    }

    public async Task<ScoreboardRow> BuildRowAsync(CrewMembership membership)
    {
        var thisWeek = WeekKeys.WeekKeyFor(DateTime.UtcNow);

        var weekly = await _db.WeeklyResults
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.MembershipId == membership.Id && w.WeekKey == thisWeek);

        var metWeeks = await _db.WeeklyResults
            .AsNoTracking()
            .Where(w => w.MembershipId == membership.Id && w.TargetMet)
            .Select(w => w.WeekKey)
            .ToListAsync();

        var displayName = await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == membership.UserId)
            .Select(u => u.DisplayName)
            .FirstAsync();

        var badges = await _db.Achievements
            .AsNoTracking()
            .Where(a => a.MembershipId == membership.Id)
            .Select(a => a.Code)
            .ToListAsync();

        var progress = weekly is null ? null : new WeekProgress(weekly.CheckInCount, weekly.TargetMet);

        return BuildRow(
            membership.UserId,
            displayName,
            membership.Xp,
            membership.WeeklyTarget,
            progress,
            metWeeks.ToHashSet(),
            thisWeek,
            badges);
    }

    public async Task<List<CrewLeaderboardRow>> BuildCrewLeaderboardAsync()
    {
        var thisWeek = WeekKeys.WeekKeyFor(DateTime.UtcNow);

        var members = await _db.CrewMemberships
            .AsNoTracking()
            .Select(m => new { m.Id, m.CrewId, CrewName = m.Crew.Name })
            .ToListAsync();

        if (members.Count == 0)
        {
            return new List<CrewLeaderboardRow>();
        }

        var membershipIds = members.Select(m => m.Id).ToList();

        var metWeeks = await _db.WeeklyResults
            .AsNoTracking()
            .Where(w => membershipIds.Contains(w.MembershipId) && w.TargetMet)
            .Select(w => new { w.MembershipId, w.WeekKey })
            .ToListAsync();

        var metByMembership = metWeeks
            .GroupBy(w => w.MembershipId)
            .ToDictionary(g => g.Key, g => g.Select(w => w.WeekKey).ToHashSet());

        var streakByMembership = membershipIds.ToDictionary(
            id => id,
            id => StreakCalculator.Compute(metByMembership.GetValueOrDefault(id) ?? new HashSet<DateOnly>(), thisWeek));

        return members
            .GroupBy(m => new { m.CrewId, m.CrewName })
            .Select(g => new CrewLeaderboardRow
            {
                CrewId = g.Key.CrewId,
                Name = g.Key.CrewName,
                MemberCount = g.Count(),
                AverageStreak = g.Average(m => streakByMembership[m.Id])
            })
            .OrderByDescending(r => r.AverageStreak)
            .ThenByDescending(r => r.MemberCount)
            .ThenBy(r => r.Name)
            .ToList();
    }

    private static ScoreboardRow BuildRow(
        int userId,
        string displayName,
        int xp,
        int weeklyTarget,
        WeekProgress? week,
        ISet<DateOnly>? metWeeks,
        DateOnly thisWeek,
        List<string>? badges)
    {
        return new ScoreboardRow
        {
            UserId = userId,
            DisplayName = displayName,
            Xp = xp,
            CurrentStreak = StreakCalculator.Compute(metWeeks ?? new HashSet<DateOnly>(), thisWeek),
            CheckInCount = week?.CheckInCount ?? 0,
            WeeklyTarget = weeklyTarget,
            TargetMet = week?.TargetMet ?? false,
            Badges = badges ?? new List<string>()
        };
    }

    private record MemberCore(int Id, int UserId, string DisplayName, int Xp, int WeeklyTarget);

    private record WeekProgress(int CheckInCount, bool TargetMet);
}
