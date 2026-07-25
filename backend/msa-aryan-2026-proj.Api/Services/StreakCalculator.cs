namespace msa_aryan_2026_proj.Api.Services;

public static class StreakCalculator
{
    public static int Compute(ISet<DateOnly> metWeeks, DateOnly thisWeek)
    {
        var cursor = thisWeek;

        if (!metWeeks.Contains(cursor))
        {
            cursor = cursor.AddDays(-7);
        }

        var streak = 0;
        while (metWeeks.Contains(cursor))
        {
            streak++;
            cursor = cursor.AddDays(-7);
        }

        return streak;
    }
}
