namespace PtStudio.Api.DTOs;

public class TokenResponseDto
{
    public string Token { get; set; } = null!;
    public DateTime Expiration { get; set; }
    public string FullName { get; set; } = null!;
    public string Role { get; set; } = null!;
}
