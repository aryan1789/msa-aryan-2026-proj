namespace msa_aryan_2026_proj.Api.Models;

public class Achievement
{
    public int Id { get; set; }
    public int MembershipId { get; set; }
    public string Code { get; set; } = string.Empty;
    public DateTime EarnedAt { get; set; }

    public CrewMembership Membership { get; set; } = null!;
}
