namespace PtStudio.Api.DTOs;

public class PackageCreateDto
{
    public string Name { get; set; } = null!;
    public int SessionCount { get; set; }
    public int DefaultDurationMinutes { get; set; } = 60;
    public int? MaxDays { get; set; }
    public decimal Price { get; set; }
}
