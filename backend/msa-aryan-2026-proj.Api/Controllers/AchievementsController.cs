using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using msa_aryan_2026_proj.Api.Data;

namespace msa_aryan_2026_proj.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class AchievementsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AchievementsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // The caller's badges across all their crews, one entry per badge code with
    // the earliest date it was earned and how many crews they've earned it in.
    [HttpGet]
    public async Task<ActionResult> Mine()
    {
        var userId = GetUserId();

        var earned = await _dbContext.Achievements
            .AsNoTracking()
            .Where(a => a.Membership.UserId == userId)
            .GroupBy(a => a.Code)
            .Select(g => new
            {
                code = g.Key,
                earnedAt = g.Min(a => a.EarnedAt),
                count = g.Count()
            })
            .ToListAsync();

        return Ok(earned);
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
