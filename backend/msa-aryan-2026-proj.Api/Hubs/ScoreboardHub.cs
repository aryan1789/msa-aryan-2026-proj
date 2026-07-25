using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using msa_aryan_2026_proj.Api.Data;

namespace msa_aryan_2026_proj.Api.Hubs;

[Authorize]
public class ScoreboardHub : Hub
{
    private readonly AppDbContext _dbContext;

    public ScoreboardHub(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public static string GroupFor(int crewId) => $"crew-{crewId}";

    public async Task JoinCrew(int crewId)
    {
        var userId = GetUserId();

        var isMember = await _dbContext.CrewMemberships
            .AnyAsync(m => m.CrewId == crewId && m.UserId == userId);

        if (!isMember)
        {
            throw new HubException("You are not a member of this crew.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupFor(crewId));
    }

    public async Task LeaveCrew(int crewId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupFor(crewId));
    }

    private int GetUserId()
    {
        var sub = Context.User?.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (!int.TryParse(sub, out var userId))
        {
            throw new HubException("Authenticated token is missing a valid user id.");
        }

        return userId;
    }
}
