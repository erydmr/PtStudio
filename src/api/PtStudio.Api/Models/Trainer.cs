namespace PtStudio.Api.Models;

public class Trainer
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? Specialization { get; set; }
    public string? Color { get; set; }
    public bool IsActive { get; set; } = true;

    public User User { get; set; } = null!;
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
