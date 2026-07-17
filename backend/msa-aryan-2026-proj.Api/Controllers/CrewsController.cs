using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using msa_aryan_2026_proj.Api.Data;
using msa_aryan_2026_proj.Api.Models;

namespace msa_aryan_2026_proj.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class CrewsController : ControllerBase
{
    private const string InviteCodeAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private const int InviteCodeLength = 8;

    private readonly ILogger<CrewsController> _logger;
    private readonly AppDbContext _dbContext;

    public CrewsController(ILogger<CrewsController> logger, AppDbContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateCrewRequest request)
    {
        var userId = GetUserId();

        var crew = new Crew
        {
            Name = request.Name,
            DefaultWeeklyTarget = request.DefaultWeeklyTarget,
            CreatedByUserId = userId
        };

        var membership = new CrewMembership
        {
            Crew = crew,
            UserId = userId,
            WeeklyTarget = crew.DefaultWeeklyTarget,
            CurrentStreak = 0
        };

        _dbContext.Crews.Add(crew);
        _dbContext.CrewMemberships.Add(membership);

        const int maxAttempts = 5;
        for (var attempt = 1; ; attempt++)
        {
            crew.InviteCode = GenerateInviteCode();

            try
            {
                await _dbContext.SaveChangesAsync();
                break;
            }
            catch (DbUpdateException ex) when (
                ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation }
                && attempt < maxAttempts)
            {
                _logger.LogWarning(ex, "Invite code collision on attempt {Attempt}; regenerating.", attempt);
            }
        }

        return Created($"/Crews/{crew.Id}", new
        {
            crew.Id,
            crew.Name,
            crew.InviteCode,
            crew.DefaultWeeklyTarget
        });
    }

    [HttpPost("join")]
    public async Task<ActionResult> Join([FromBody] JoinCrewRequest request)
    {
        var userId = GetUserId();

        var inviteCode = request.InviteCode.Trim().ToUpperInvariant();

        var crew = await _dbContext.Crews
            .FirstOrDefaultAsync(c => c.InviteCode == inviteCode);

        if (crew is null)
        {
            return NotFound(new { message = "No crew found with that invite code." });
        }

        var alreadyMember = await _dbContext.CrewMemberships
            .AnyAsync(m => m.CrewId == crew.Id && m.UserId == userId);

        if (alreadyMember)
        {
            return Conflict(new { message = "You are already a member of this crew." });
        }

        var membership = new CrewMembership
        {
            CrewId = crew.Id,
            UserId = userId,
            WeeklyTarget = crew.DefaultWeeklyTarget,
            CurrentStreak = 0
        };

        _dbContext.CrewMemberships.Add(membership);

        try
        {
            await _dbContext.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (
            ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            return Conflict(new { message = "You are already a member of this crew." });
        }

        return Ok(new
        {
            crew.Id,
            crew.Name,
            membership.WeeklyTarget,
            membership.CurrentStreak
        });
    }

    [HttpGet]
    public async Task<ActionResult> List()
    {
        var userId = GetUserId();

        var crews = await _dbContext.CrewMemberships
            .AsNoTracking()
            .Where(m => m.UserId == userId)
            .Select(m => new MyCrewResponse
            {
                Id = m.Crew.Id,
                Name = m.Crew.Name,
                InviteCode = m.Crew.InviteCode,
                DefaultWeeklyTarget = m.Crew.DefaultWeeklyTarget,
                MyWeeklyTarget = m.WeeklyTarget,
                MyCurrentStreak = m.CurrentStreak,
                MemberCount = m.Crew.Memberships.Count
            })
            .ToListAsync();

        return Ok(crews);
    }

    [HttpDelete("{crewId:int}/membership")]
    public async Task<ActionResult> Leave(int crewId)
    {
        var userId = GetUserId();

        var membership = await _dbContext.CrewMemberships
            .Include(m => m.Crew)
            .FirstOrDefaultAsync(m => m.CrewId == crewId && m.UserId == userId);

        if (membership is null)
        {
            return NotFound(new { message = "You are not a member of this crew." });
        }

        if (membership.Crew.CreatedByUserId == userId)
        {
            return Conflict(new { message = "As the crew's creator you can't leave. Transfer ownership or delete the crew instead." });
        }

        _dbContext.CrewMemberships.Remove(membership);

        try
        {
            await _dbContext.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            // Another request already removed this membership; leaving is idempotent.
        }

        return NoContent();
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

    private static string GenerateInviteCode()
    {
        var code = new char[InviteCodeLength];

        for (var i = 0; i < code.Length; i++)
        {
            code[i] = InviteCodeAlphabet[RandomNumberGenerator.GetInt32(InviteCodeAlphabet.Length)];
        }

        return new string(code);
    }
}

public class CreateCrewRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Range(1, 7)]
    public int DefaultWeeklyTarget { get; set; }
}

public class JoinCrewRequest
{
    [Required]
    [StringLength(8)]
    public string InviteCode { get; set; } = string.Empty;
}

public class MyCrewResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string InviteCode { get; set; } = string.Empty;
    public int DefaultWeeklyTarget { get; set; }
    public int MyWeeklyTarget { get; set; }
    public int MyCurrentStreak { get; set; }
    public int MemberCount { get; set; }
}
