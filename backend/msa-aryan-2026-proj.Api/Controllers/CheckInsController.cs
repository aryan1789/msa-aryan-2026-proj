using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using msa_aryan_2026_proj.Api.Data;
using msa_aryan_2026_proj.Api.Hubs;
using msa_aryan_2026_proj.Api.Models;
using msa_aryan_2026_proj.Api.Services;

namespace msa_aryan_2026_proj.Api.Controllers;

[ApiController]
[Route("Crews/{crewId:int}/check-ins")]
[Authorize]
public class CheckInsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IScoringService _scoringService;
    private readonly IScoreboardService _scoreboardService;
    private readonly IHubContext<ScoreboardHub> _hubContext;
    private readonly ILogger<CheckInsController> _logger;

    public CheckInsController(
        AppDbContext dbContext,
        IScoringService scoringService,
        IScoreboardService scoreboardService,
        IHubContext<ScoreboardHub> hubContext,
        ILogger<CheckInsController> logger)
    {
        _dbContext = dbContext;
        _scoringService = scoringService;
        _scoreboardService = scoreboardService;
        _hubContext = hubContext;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult> Create(int crewId, [FromBody] CreateCheckInRequest request)
    {
        var note = request.Note?.Trim() ?? string.Empty;

        if (note.Length == 0)
        {
            return BadRequest(new { message = "A check-in note is required." });
        }

        var userId = GetUserId();

        var membership = await _dbContext.CrewMemberships
            .FirstOrDefaultAsync(m => m.CrewId == crewId && m.UserId == userId);

        if (membership is null)
        {
            return NotFound(new { message = "You are not a member of this crew." });
        }

        CheckInResult result;
        try
        {
            result = await _scoringService.RecordCheckInAsync(membership, note);
        }
        catch (DuplicateCheckInException)
        {
            return Conflict(new { message = "You have already checked in today." });
        }

        await EmitScoreboardUpdateAsync(crewId, membership);

        return Created($"/Crews/{crewId}/check-ins", new
        {
            xp = result.Xp,
            checkInCount = result.CheckInCount,
            weeklyTarget = result.WeeklyTarget,
            targetMet = result.TargetMet,
            justMet = result.JustMet,
            newBadges = result.NewBadges
        });
    }

    [HttpGet]
    public async Task<ActionResult> List(int crewId, [FromQuery] DateOnly? week)
    {
        var userId = GetUserId();

        var membership = await _dbContext.CrewMemberships
            .FirstOrDefaultAsync(m => m.CrewId == crewId && m.UserId == userId);

        if (membership is null)
        {
            return NotFound(new { message = "You are not a member of this crew." });
        }

        var weekKey = week ?? WeekKeys.WeekKeyFor(DateTime.UtcNow);

        var checkIns = await _dbContext.CheckIns
            .AsNoTracking()
            .Where(c => c.MembershipId == membership.Id && c.WeekKey == weekKey)
            .OrderBy(c => c.OccurredAt)
            .Select(c => new
            {
                c.Id,
                c.OccurredAt,
                c.DayKey,
                c.Note
            })
            .ToListAsync();

        var weekly = await _dbContext.WeeklyResults
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.MembershipId == membership.Id && w.WeekKey == weekKey);

        return Ok(new
        {
            weekKey,
            checkInCount = weekly?.CheckInCount ?? 0,
            weeklyTarget = membership.WeeklyTarget,
            targetMet = weekly?.TargetMet ?? false,
            xp = membership.Xp,
            checkIns
        });
    }

    [HttpPut("{checkInId:int}")]
    public async Task<ActionResult> Update(int crewId, int checkInId, [FromBody] UpdateCheckInRequest request)
    {
        var note = request.Note?.Trim() ?? string.Empty;

        if (note.Length == 0)
        {
            return BadRequest(new { message = "A check-in note is required." });
        }

        var userId = GetUserId();

        var membership = await _dbContext.CrewMemberships
            .FirstOrDefaultAsync(m => m.CrewId == crewId && m.UserId == userId);

        if (membership is null)
        {
            return NotFound(new { message = "That check-in was not found." });
        }

        var checkIn = await _dbContext.CheckIns
            .FirstOrDefaultAsync(c => c.Id == checkInId && c.MembershipId == membership.Id);

        if (checkIn is null)
        {
            return NotFound(new { message = "That check-in was not found." });
        }

        checkIn.Note = note;
        await _dbContext.SaveChangesAsync();

        return Ok(new { checkIn.Id, checkIn.Note });
    }

    [HttpDelete("{checkInId:int}")]
    public async Task<ActionResult> Delete(int crewId, int checkInId)
    {
        var userId = GetUserId();

        var membership = await _dbContext.CrewMemberships
            .FirstOrDefaultAsync(m => m.CrewId == crewId && m.UserId == userId);

        if (membership is null)
        {
            return NotFound(new { message = "That check-in was not found." });
        }

        var checkIn = await _dbContext.CheckIns
            .FirstOrDefaultAsync(c => c.Id == checkInId && c.MembershipId == membership.Id);

        if (checkIn is null)
        {
            return NotFound(new { message = "That check-in was not found." });
        }

        await _scoringService.ReverseCheckInAsync(membership, checkIn);

        await EmitScoreboardUpdateAsync(crewId, membership);

        return NoContent();
    }

    private async Task EmitScoreboardUpdateAsync(int crewId, CrewMembership membership)
    {
        try
        {
            var row = await _scoreboardService.BuildRowAsync(membership);

            await _hubContext.Clients
                .Group(ScoreboardHub.GroupFor(crewId))
                .SendAsync("scoreboardUpdated", row);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to emit scoreboard update for crew {CrewId}.", crewId);
        }
    }

    private int GetUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (!int.TryParse(sub, out var userId))
        {
            throw new InvalidOperationException("Authenticated token is missing a valid user id.");
        }

        return userId;
    }
}

public class CreateCheckInRequest
{
    [Required]
    [StringLength(500)]
    public string Note { get; set; } = string.Empty;
}

public class UpdateCheckInRequest
{
    [Required]
    [StringLength(500)]
    public string Note { get; set; } = string.Empty;
}
