using PtStudio.Api.Enums;

namespace PtStudio.Api.Models;

public class ClientPackage
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public int PackageId { get; set; }
    public int RemainingSessions { get; set; }
    public DateTime PurchaseDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public PackageStatus Status { get; set; } = PackageStatus.Active;

    public Client Client { get; set; } = null!;
    public Package Package { get; set; } = null!;
    public ICollection<CreditAdjustment> CreditAdjustments { get; set; } = new List<CreditAdjustment>();
    public ICollection<AppointmentClient> AppointmentClients { get; set; } = new List<AppointmentClient>();
}
