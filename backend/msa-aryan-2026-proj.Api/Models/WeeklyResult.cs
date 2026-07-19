namespace msa_aryan_2026_proj.Api.Models;

public class WeeklyResult
{
    public int Id { get; set; }
    public int MembershipId { get; set; }
    public DateOnly WeekKey { get; set; }
    public int CheckInCount { get; set; }
    public bool TargetMet { get; set; }

    public CrewMembership Membership { get; set; } = null!;
}
