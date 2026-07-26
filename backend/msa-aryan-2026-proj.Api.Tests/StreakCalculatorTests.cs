using msa_aryan_2026_proj.Api.Services;

namespace msa_aryan_2026_proj.Api.Tests;

public class StreakCalculatorTests
{
    // A fixed "current week" Monday to anchor every case. Earlier weeks are
    // this date minus a multiple of 7 days.
    private static readonly DateOnly ThisWeek = new(2026, 7, 20);

    private static DateOnly WeeksAgo(int n) => ThisWeek.AddDays(-7 * n);

    private static HashSet<DateOnly> Weeks(params int[] weeksAgo) =>
        weeksAgo.Select(WeeksAgo).ToHashSet();

    [Fact]
    public void Compute_NoMetWeeks_ReturnsZero()
    {
        var result = StreakCalculator.Compute(new HashSet<DateOnly>(), ThisWeek);

        Assert.Equal(0, result);
    }

    [Fact]
    public void Compute_ThisWeekMet_CountsCurrentWeek()
    {
        // Target already hit this week, nothing before it.
        var result = StreakCalculator.Compute(Weeks(0), ThisWeek);

        Assert.Equal(1, result);
    }

    [Fact]
    public void Compute_ThisWeekNotMetButLastWeekMet_CountsFromLastWeek()
    {
        // The in-progress current week hasn't met target yet, but the streak
        // running through last week must not be penalised for that.
        var result = StreakCalculator.Compute(Weeks(1, 2, 3), ThisWeek);

        Assert.Equal(3, result);
    }

    [Fact]
    public void Compute_ThisWeekMetAndPriorWeeksMet_CountsThroughCurrentWeek()
    {
        var result = StreakCalculator.Compute(Weeks(0, 1, 2), ThisWeek);

        Assert.Equal(3, result);
    }

    [Fact]
    public void Compute_GapBreaksStreak()
    {
        // Weeks 0 and 1 are met, week 2 is missed, week 3 is met. The streak
        // stops at the gap and does not reach back to week 3.
        var result = StreakCalculator.Compute(Weeks(0, 1, 3), ThisWeek);

        Assert.Equal(2, result);
    }

    [Fact]
    public void Compute_LongConsecutiveRun_CountsEveryWeek()
    {
        var result = StreakCalculator.Compute(Weeks(0, 1, 2, 3, 4, 5, 6, 7), ThisWeek);

        Assert.Equal(8, result);
    }

    [Fact]
    public void Compute_MetWeeksNotContiguousWithToday_DoNotCount()
    {
        // Neither this week nor last week is met, so the streak is broken at
        // the front. Older met weeks are stranded and count for nothing.
        var result = StreakCalculator.Compute(Weeks(2, 3, 4), ThisWeek);

        Assert.Equal(0, result);
    }
}
