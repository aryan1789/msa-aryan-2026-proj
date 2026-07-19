using Microsoft.EntityFrameworkCore;
using Npgsql;
using msa_aryan_2026_proj.Api.Data;
using msa_aryan_2026_proj.Api.Models;

namespace msa_aryan_2026_proj.Api.Services;

public class ScoringService : IScoringService
{
    private const int XpPerCheckIn = 10;
    private const int TargetMetBonus = 50;
    private const int MaxAttempts = 3;

    private const string DayKeyIndex = "IX_CheckIns_MembershipId_DayKey";
    private const string WeekKeyIndex = "IX_WeeklyResults_MembershipId_WeekKey";

    private readonly AppDbContext _db;

    public ScoringService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<CheckInResult> RecordCheckInAsync(CrewMembership membership, string note)
    {
        var now = DateTime.UtcNow;
        var week = WeekKeys.WeekKeyFor(now);
        var day = WeekKeys.DayKeyFor(now);

        for (var attempt = 1; ; attempt++)
        {
            var weekly = await _db.WeeklyResults
                .FirstOrDefaultAsync(w => w.MembershipId == membership.Id && w.WeekKey == week);

            if (weekly is null)
            {
                weekly = new WeeklyResult { MembershipId = membership.Id, WeekKey = week };
                _db.WeeklyResults.Add(weekly);
            }

            weekly.CheckInCount++;
            var justMet = !weekly.TargetMet && weekly.CheckInCount >= membership.WeeklyTarget;
            weekly.TargetMet = weekly.CheckInCount >= membership.WeeklyTarget;

            var xpAward = XpPerCheckIn + (justMet ? TargetMetBonus : 0);
            membership.Xp += xpAward;

            var checkIn = new CheckIn
            {
                MembershipId = membership.Id,
                OccurredAt = now,
                WeekKey = week,
                DayKey = day,
                Note = note
            };
            _db.CheckIns.Add(checkIn);

            try
            {
                await _db.SaveChangesAsync();

                return new CheckInResult(
                    membership.Xp,
                    weekly.CheckInCount,
                    membership.WeeklyTarget,
                    weekly.TargetMet,
                    justMet);
            }
            catch (DbUpdateException ex) when (IsUniqueViolation(ex, out var constraint))
            {
                if (constraint == DayKeyIndex)
                {
                    throw new DuplicateCheckInException();
                }

                if (constraint == WeekKeyIndex && attempt < MaxAttempts)
                {
                    membership.Xp -= xpAward;
                    _db.Entry(checkIn).State = EntityState.Detached;
                    _db.Entry(weekly).State = EntityState.Detached;
                    continue;
                }

                throw;
            }
        }
    }

    public async Task ReverseCheckInAsync(CrewMembership membership, CheckIn checkIn)
    {
        var weekly = await _db.WeeklyResults
            .FirstOrDefaultAsync(w => w.MembershipId == membership.Id && w.WeekKey == checkIn.WeekKey);

        _db.CheckIns.Remove(checkIn);

        var xpToRemove = XpPerCheckIn;

        if (weekly is not null)
        {
            weekly.CheckInCount = Math.Max(0, weekly.CheckInCount - 1);

            if (weekly.TargetMet && weekly.CheckInCount < membership.WeeklyTarget)
            {
                weekly.TargetMet = false;
                xpToRemove += TargetMetBonus;
            }
        }

        membership.Xp = Math.Max(0, membership.Xp - xpToRemove);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
        }
    }

    private static bool IsUniqueViolation(DbUpdateException ex, out string? constraintName)
    {
        if (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } pg)
        {
            constraintName = pg.ConstraintName;
            return true;
        }

        constraintName = null;
        return false;
    }
}
