using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PtStudio.Api.Data;
using PtStudio.Api.Enums;
using PtStudio.Api.Mappings;
using PtStudio.Api.Models;
using PtStudio.Api.Services;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<TrainerService>();
builder.Services.AddScoped<ClientService>();
builder.Services.AddScoped<PackageService>();
builder.Services.AddScoped<ClientPackageService>();
builder.Services.AddScoped<AppointmentService>();
builder.Services.AddScoped<AttendanceService>();
builder.Services.AddScoped<CancellationService>();
builder.Services.AddScoped<CreditAdjustmentService>();
builder.Services.AddScoped<SettingService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<ReportService>();
builder.Services.AddScoped<ExcelExportService>();

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.UTF8.GetBytes(jwtSettings["Secret"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

builder.Services.AddAuthorization();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:3000"])
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new PtStudio.Api.Converters.UtcDateTimeConverter());
    });

var app = builder.Build();

// Seed
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await context.Database.MigrateAsync();

    if (!await context.Users.AnyAsync(u => u.Role == UserRole.Admin))
    {
        context.Users.Add(new User
        {
            FullName = "Admin",
            Email = "admin@ptstudio.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();
    }

    if (!await context.Settings.AnyAsync(s => s.Key == "CancellationWindowHours"))
    {
        context.Settings.Add(new Setting
        {
            Key = "CancellationWindowHours",
            Value = "6",
            Description = "Ders iptali icin minimum saat"
        });
        await context.SaveChangesAsync();
    }

    if (!await context.Settings.AnyAsync(s => s.Key == "StudioQrToken"))
    {
        context.Settings.Add(new Setting
        {
            Key = "StudioQrToken",
            Value = Guid.NewGuid().ToString("N"),
            Description = "Salon QR kodu icin benzersiz token"
        });
        await context.SaveChangesAsync();
    }
}

app.UseSerilogRequestLogging();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
