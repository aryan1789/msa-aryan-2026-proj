using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using msa_aryan_2026_proj.Api.Services;

namespace msa_aryan_2026_proj.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class LeaderboardController : ControllerBase
{
    private readonly IScoreboardService _scoreboardService;

    public LeaderboardController(IScoreboardService scoreboardService)
    {
        _scoreboardService = scoreboardService;
    }

    // Every crew ranked by its members' average current streak.
    [HttpGet]
    public async Task<ActionResult> Get()
    {
        var rows = await _scoreboardService.BuildCrewLeaderboardAsync();
        return Ok(rows);
    }
}
