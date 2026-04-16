namespace PtStudio.Api.DTOs;

public class PackageDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public int SessionCount { get; set; }
    public int DefaultDurationMinutes { get; set; }
    public int? MaxDays { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; }
}
