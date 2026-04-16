using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using PtStudio.Api.Data;
using PtStudio.Api.DTOs;
using PtStudio.Api.Enums;
using PtStudio.Api.Models;

namespace PtStudio.Api.Services;

public class AuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(AppDbContext context, IConfiguration configuration, ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<TokenResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsActive);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            _logger.LogWarning("Basarisiz giris denemesi: {Email}", dto.Email);
            return null;
        }

        var token = GenerateJwtToken(user);

        return new TokenResponseDto
        {
            Token = token.Token,
            Expiration = token.Expiration,
            FullName = user.FullName,
            Role = user.Role.ToString()
        };
    }

    public async Task<UserDto?> RegisterAsync(RegisterDto dto, int createdByUserId)
    {
        var exists = await _context.Users.AnyAsync(u => u.Email == dto.Email);
        if (exists)
            return null;

        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        if (dto.Role == UserRole.Trainer)
        {
            var trainer = new Trainer
            {
                UserId = user.Id,
                Specialization = dto.Specialization,
                Color = dto.Color,
                IsActive = true
            };
            _context.Trainers.Add(trainer);
            await _context.SaveChangesAsync();
        }
        else if (dto.Role == UserRole.Client)
        {
            var client = new Client
            {
                UserId = user.Id,
                Notes = dto.Notes,
                EmergencyContact = dto.EmergencyContact,
                IsActive = true
            };
            _context.Clients.Add(client);
            await _context.SaveChangesAsync();
        }

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = createdByUserId,
            Action = AuditAction.Created,
            EntityType = nameof(User),
            EntityId = user.Id,
            Details = JsonConvert.SerializeObject(new { user.Email, user.Role }),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }

    private (string Token, DateTime Expiration) GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Secret"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiration = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpirationMinutes"]!));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: expiration,
            signingCredentials: credentials
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expiration);
    }
}
