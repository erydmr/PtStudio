namespace PtStudio.Api.DTOs;

public class CreditAdjustmentCreateDto
{
    public int ClientPackageId { get; set; }
    public int Amount { get; set; }
    public string Reason { get; set; } = null!;
}

public class CreditAdjustmentDto
{
    public int Id { get; set; }
    public int ClientPackageId { get; set; }
    public string ClientFullName { get; set; } = null!;
    public string PackageName { get; set; } = null!;
    public int Amount { get; set; }
    public string Reason { get; set; } = null!;
    public string AdjustedByFullName { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
