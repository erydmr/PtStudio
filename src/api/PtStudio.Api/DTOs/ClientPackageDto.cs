namespace PtStudio.Api.DTOs;

public class ClientPackageDto
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public string ClientFullName { get; set; } = null!;
    public int PackageId { get; set; }
    public string PackageName { get; set; } = null!;
    public int RemainingSessions { get; set; }
    public DateTime PurchaseDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string Status { get; set; } = null!;
}
