namespace msa_aryan_2026_proj.Api.Models;

public class CheckIn
{
    public int Id { get; set; }
    public int MembershipId { get; set; }
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public DateOnly WeekKey { get; set; }
    public string Note { get; set; } = string.Empty;

    public CrewMembership Membership { get; set; } = null!;
}
