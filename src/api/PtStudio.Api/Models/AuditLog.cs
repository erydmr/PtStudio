using PtStudio.Api.Enums;

namespace PtStudio.Api.Models;

public class AuditLog
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public AuditAction Action { get; set; }
    public string EntityType { get; set; } = null!;
    public int EntityId { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
