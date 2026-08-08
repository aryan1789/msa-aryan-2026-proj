namespace msa_aryan_2026_proj.Api.Services;

public class CrewLeaderboardRow
{
    public int CrewId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public double AverageStreak { get; set; }
}
