using msa_aryan_2026_proj.Api.Models;

namespace msa_aryan_2026_proj.Api.Services;

public interface ITokenService
{
    string CreateToken(User user);
}