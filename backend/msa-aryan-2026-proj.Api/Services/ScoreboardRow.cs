namespace msa_aryan_2026_proj.Api.Services;

public class ScoreboardRow
{
    public int UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public int Xp { get; set; }
    public int CurrentStreak { get; set; }
    public int CheckInCount { get; set; }
    public int WeeklyTarget { get; set; }
    public bool TargetMet { get; set; }
}
