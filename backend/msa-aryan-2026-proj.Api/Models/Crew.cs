namespace msa_aryan_2026_proj.Api.Models;

public class Crew
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string InviteCode { get; set; } = string.Empty;
    public int DefaultWeeklyTarget { get; set; }
    public int CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CrewMembership> Memberships { get; set; } = new List<CrewMembership>();
    public User CreatedBy { get; set; } = null!;
}