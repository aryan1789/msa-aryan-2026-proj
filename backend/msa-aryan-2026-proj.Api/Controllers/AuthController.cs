using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using BCryptNet = BCrypt.Net.BCrypt;
using msa_aryan_2026_proj.Api.Data;
using msa_aryan_2026_proj.Api.Models;
using msa_aryan_2026_proj.Api.Services;

namespace msa_aryan_2026_proj.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private const string InvalidCredentialsMessage = "Invalid email or password.";
    private static readonly string DummyPasswordHash = BCryptNet.HashPassword("dummy-password-value");

    private readonly ILogger<AuthController> _logger;
    private readonly AppDbContext _dbContext;
    private readonly ITokenService _tokenService;

    public AuthController(ILogger<AuthController> logger, AppDbContext dbContext, ITokenService tokenService)
    {
        _logger = logger;
        _dbContext = dbContext;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult> Register([FromBody] RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var existingUser = await _dbContext.Users
            .AnyAsync(user => user.Email == email);

        if (existingUser)
        {
            return Conflict(new { message = "An account with this email already exists." });
        }

        var user = new User
        {
            Email = email,
            DisplayName = request.DisplayName,
            PasswordHash = BCryptNet.HashPassword(request.Password)
        };

        await _dbContext.Users.AddAsync(user);
        try
        {
            await _dbContext.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (
            ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            return Conflict(new { message = "An account with this email already exists." });
        }

        return Ok(new
        {
            user.Id,
            user.Email,
            user.DisplayName
        });
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult> Login([FromBody] LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await _dbContext.Users
            .FirstOrDefaultAsync(existingUser => existingUser.Email == email);

        if (user is null)
        {
            BCryptNet.Verify(request.Password, DummyPasswordHash);
            return Unauthorized(new { message = InvalidCredentialsMessage });
        }

        var passwordMatches = BCryptNet.Verify(request.Password, user.PasswordHash);

        if (!passwordMatches)
        {
            return Unauthorized(new { message = InvalidCredentialsMessage });
        }

        return Ok(new
        {
            token = _tokenService.CreateToken(user),
            user.Id,
            user.Email,
            user.DisplayName
        });
    }

    [Authorize]
    [HttpGet("me")]
    public ActionResult Me()
    {
        var id = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        var email = User.FindFirstValue(JwtRegisteredClaimNames.Email);

        return Ok(new
        {
            id,
            email
        });
    }
}

public class RegisterRequest
{
    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string DisplayName { get; set; } = string.Empty;

    [Required]
    [StringLength(72, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;
}

public class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
    