using Microsoft.EntityFrameworkCore;
using PtStudio.Api.Models;

namespace PtStudio.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Trainer> Trainers => Set<Trainer>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Package> Packages => Set<Package>();
    public DbSet<ClientPackage> ClientPackages => Set<ClientPackage>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<AppointmentClient> AppointmentClients => Set<AppointmentClient>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<CreditAdjustment> CreditAdjustments => Set<CreditAdjustment>();
    public DbSet<Setting> Settings => Set<Setting>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasConversion<int>();
        });

        // Trainer
        modelBuilder.Entity<Trainer>(e =>
        {
            e.HasOne(t => t.User)
                .WithOne(u => u.Trainer)
                .HasForeignKey<Trainer>(t => t.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Client
        modelBuilder.Entity<Client>(e =>
        {
            e.HasOne(c => c.User)
                .WithOne(u => u.Client)
                .HasForeignKey<Client>(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Package
        modelBuilder.Entity<Package>(e =>
        {
            e.Property(p => p.Price).HasColumnType("decimal(18,2)");
        });

        // ClientPackage
        modelBuilder.Entity<ClientPackage>(e =>
        {
            e.Property(cp => cp.Status).HasConversion<int>();

            e.HasOne(cp => cp.Client)
                .WithMany(c => c.ClientPackages)
                .HasForeignKey(cp => cp.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(cp => cp.Package)
                .WithMany(p => p.ClientPackages)
                .HasForeignKey(cp => cp.PackageId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Appointment
        modelBuilder.Entity<Appointment>(e =>
        {
            e.Property(a => a.Status).HasConversion<int>();

            e.HasOne(a => a.Trainer)
                .WithMany(t => t.Appointments)
                .HasForeignKey(a => a.TrainerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // AppointmentClient
        modelBuilder.Entity<AppointmentClient>(e =>
        {
            e.Property(ac => ac.Status).HasConversion<int>();

            e.HasOne(ac => ac.Appointment)
                .WithMany(a => a.AppointmentClients)
                .HasForeignKey(ac => ac.AppointmentId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(ac => ac.Client)
                .WithMany(c => c.AppointmentClients)
                .HasForeignKey(ac => ac.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(ac => ac.ClientPackage)
                .WithMany(cp => cp.AppointmentClients)
                .HasForeignKey(ac => ac.ClientPackageId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Attendance
        modelBuilder.Entity<Attendance>(e =>
        {
            e.Property(a => a.Method).HasConversion<int>();

            e.HasOne(a => a.AppointmentClient)
                .WithOne(ac => ac.Attendance)
                .HasForeignKey<Attendance>(a => a.AppointmentClientId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // CreditAdjustment
        modelBuilder.Entity<CreditAdjustment>(e =>
        {
            e.HasOne(ca => ca.ClientPackage)
                .WithMany(cp => cp.CreditAdjustments)
                .HasForeignKey(ca => ca.ClientPackageId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(ca => ca.AdjustedByUser)
                .WithMany()
                .HasForeignKey(ca => ca.AdjustedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // AuditLog
        modelBuilder.Entity<AuditLog>(e =>
        {
            e.Property(al => al.Action).HasConversion<int>();

            e.HasOne(al => al.User)
                .WithMany()
                .HasForeignKey(al => al.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Setting
        modelBuilder.Entity<Setting>(e =>
        {
            e.HasIndex(s => s.Key).IsUnique();
        });
    }

    public override int SaveChanges()
    {
        FixDateTimeKinds();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        FixDateTimeKinds();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void FixDateTimeKinds()
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified)) continue;

            foreach (var prop in entry.Properties)
            {
                if (prop.CurrentValue is DateTime dt && dt.Kind == DateTimeKind.Unspecified)
                    prop.CurrentValue = DateTime.SpecifyKind(dt, DateTimeKind.Utc);
            }
        }
    }
}
