namespace PtStudio.Api.DTOs;

public class TrainerDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Specialization { get; set; }
    public string? Color { get; set; }
    public bool IsActive { get; set; }
}
