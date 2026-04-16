namespace PtStudio.Api.Models;

public class Client
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? Notes { get; set; }
    public string? EmergencyContact { get; set; }
    public bool IsActive { get; set; } = true;

    public User User { get; set; } = null!;
    public ICollection<ClientPackage> ClientPackages { get; set; } = new List<ClientPackage>();
    public ICollection<AppointmentClient> AppointmentClients { get; set; } = new List<AppointmentClient>();
}
