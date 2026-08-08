using msa_aryan_2026_proj.Api.Models;

namespace msa_aryan_2026_proj.Api.Services;

public interface IScoringService
{
    Task<CheckInResult> RecordCheckInAsync(CrewMembership membership, string note);

    Task ReverseCheckInAsync(CrewMembership membership, CheckIn checkIn);
}

public record CheckInResult(
    int Xp,
    int CheckInCount,
    int WeeklyTarget,
    bool TargetMet,
    bool JustMet,
    IReadOnlyList<string> NewBadges);

public class DuplicateCheckInException : Exception
{
    public DuplicateCheckInException() : base("Already checked in today.") { }
}
