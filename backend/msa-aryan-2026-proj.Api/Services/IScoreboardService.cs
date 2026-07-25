using msa_aryan_2026_proj.Api.Models;

namespace msa_aryan_2026_proj.Api.Services;

public interface IScoreboardService
{
    Task<List<ScoreboardRow>?> BuildCrewAsync(int crewId, int requestingUserId);

    Task<ScoreboardRow> BuildRowAsync(CrewMembership membership);
}
