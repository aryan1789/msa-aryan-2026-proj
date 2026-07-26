using msa_aryan_2026_proj.Api.Services;

namespace msa_aryan_2026_proj.Api.Tests;

public class WeekKeysTests
{
    // Naive week key computed straight off the UTC calendar date, mirroring
    // WeekKeys' Monday-of-week math. Used to show what the keys would be if we
    // never converted to New Zealand time.
    private static DateOnly UtcWeekKey(DateTime utc)
    {
        var d = DateOnly.FromDateTime(utc);
        return d.AddDays(-(((int)d.DayOfWeek + 6) % 7));
    }

    [Fact]
    public void WeekKeyFor_KnownInstant_MapsToNzMonday()
    {
        // Wednesday 2026-07-15 00:00 UTC is 12:00 that day in NZ (NZST, +12).
        var utc = new DateTime(2026, 7, 15, 0, 0, 0, DateTimeKind.Utc);

        Assert.Equal(new DateOnly(2026, 7, 13), WeekKeys.WeekKeyFor(utc));
    }

    [Fact]
    public void DayKeyFor_KnownInstant_MapsToNzCalendarDay()
    {
        var utc = new DateTime(2026, 7, 15, 0, 0, 0, DateTimeKind.Utc);

        Assert.Equal(new DateOnly(2026, 7, 15), WeekKeys.DayKeyFor(utc));
    }

    [Fact]
    public void DayKeyFor_LateUtcRollsIntoNextNzDay()
    {
        // 2026-07-15 13:00 UTC is 2026-07-16 01:00 in NZ — a different day.
        var utc = new DateTime(2026, 7, 15, 13, 0, 0, DateTimeKind.Utc);

        Assert.Equal(new DateOnly(2026, 7, 16), WeekKeys.DayKeyFor(utc));
    }

    [Fact]
    public void WeekKeyFor_SundayNightAndMondayMorningNz_FallInDifferentWeeks()
    {
        // Two instants 90 minutes apart straddling the NZ week boundary.
        // Sunday 2026-07-12 23:00 NZ  == 11:00 UTC.
        var sundayNightNz = new DateTime(2026, 7, 12, 11, 0, 0, DateTimeKind.Utc);
        // Monday 2026-07-13 00:30 NZ  == 12:30 UTC.
        var mondayMorningNz = new DateTime(2026, 7, 12, 12, 30, 0, DateTimeKind.Utc);

        var sundayWeek = WeekKeys.WeekKeyFor(sundayNightNz);
        var mondayWeek = WeekKeys.WeekKeyFor(mondayMorningNz);

        // In NZ they land in adjacent weeks: the Sunday belongs to the week
        // starting 2026-07-06, the Monday opens the week starting 2026-07-13.
        Assert.Equal(new DateOnly(2026, 7, 6), sundayWeek);
        Assert.Equal(new DateOnly(2026, 7, 13), mondayWeek);
        Assert.NotEqual(sundayWeek, mondayWeek);
    }

    [Fact]
    public void WeekKeyFor_SameInstantsUnderUtc_WouldCollapseIntoOneWeek()
    {
        // The exact instants from the boundary test above. Both are still
        // Sunday 2026-07-12 on the UTC calendar, so a UTC-based week key would
        // put them in the same week — which is why the app converts to
        // Pacific/Auckland before bucketing. This is the failure the timezone
        // conversion prevents.
        var sundayNightNz = new DateTime(2026, 7, 12, 11, 0, 0, DateTimeKind.Utc);
        var mondayMorningNz = new DateTime(2026, 7, 12, 12, 30, 0, DateTimeKind.Utc);

        Assert.Equal(UtcWeekKey(sundayNightNz), UtcWeekKey(mondayMorningNz));

        // And the naive UTC key disagrees with the correct NZ key for the
        // Monday-morning instant — proving the two schemes are not equivalent.
        Assert.NotEqual(UtcWeekKey(mondayMorningNz), WeekKeys.WeekKeyFor(mondayMorningNz));
    }
}
