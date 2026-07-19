namespace msa_aryan_2026_proj.Api.Models;

public class CrewMembership
{
    public int Id { get; set; }
    public int CrewId { get; set; }
    public int UserId { get; set; }
    public int WeeklyTarget { get; set; }
    public int CurrentStreak { get; set; }
    public int Xp { get; set; }

    public Crew Crew { get; set; } = null!;
    public User User { get; set; } = null!;
    public ICollection<CheckIn> CheckIns { get; set; } = new List<CheckIn>();
    public ICollection<WeeklyResult> WeeklyResults { get; set; } = new List<WeeklyResult>();
}