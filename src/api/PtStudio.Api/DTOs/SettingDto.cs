namespace PtStudio.Api.DTOs;

public class SettingDto
{
    public int Id { get; set; }
    public string Key { get; set; } = null!;
    public string Value { get; set; } = null!;
    public string? Description { get; set; }
}

public class SettingUpdateDto
{
    public string Value { get; set; } = null!;
}
