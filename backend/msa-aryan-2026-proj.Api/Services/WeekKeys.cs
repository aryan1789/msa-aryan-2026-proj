namespace msa_aryan_2026_proj.Api.Services;

public static class WeekKeys
{
    private static readonly TimeZoneInfo AppTz =
        TimeZoneInfo.FindSystemTimeZoneById("Pacific/Auckland");

    private static DateOnly LocalDate(DateTime utc) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.SpecifyKind(utc, DateTimeKind.Utc), AppTz));

    public static DateOnly DayKeyFor(DateTime utc) => LocalDate(utc);

    public static DateOnly WeekKeyFor(DateTime utc)
    {
        var d = LocalDate(utc);
        return d.AddDays(-(((int)d.DayOfWeek + 6) % 7));
    }
}
