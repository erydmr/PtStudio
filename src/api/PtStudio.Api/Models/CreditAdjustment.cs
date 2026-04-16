namespace PtStudio.Api.Models;

public class CreditAdjustment
{
    public int Id { get; set; }
    public int ClientPackageId { get; set; }
    public int Amount { get; set; }
    public string Reason { get; set; } = null!;
    public int AdjustedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ClientPackage ClientPackage { get; set; } = null!;
    public User AdjustedByUser { get; set; } = null!;
}
