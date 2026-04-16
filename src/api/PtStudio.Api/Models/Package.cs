namespace PtStudio.Api.Models;

public class Package
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public int SessionCount { get; set; }
    public int DefaultDurationMinutes { get; set; } = 60;
    public int? MaxDays { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<ClientPackage> ClientPackages { get; set; } = new List<ClientPackage>();
}
