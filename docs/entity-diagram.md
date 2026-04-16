# PtStudio — Entity Iliskileri

```
┌──────────┐
│   User   │
│──────────│
│ Id       │
│ FullName │
│ Email    │
│ Phone    │
│ Password │
│ Role     │──────────────────────────────────────────────┐
│ IsActive │                                              │
│ CreatedAt│                                              │
└────┬─────┘                                              │
     │ 1:1                                                │
     ├──────────────────────┐                             │
     │                      │                             │
     ▼                      ▼                             │
┌──────────┐          ┌──────────┐                        │
│ Trainer  │          │  Client  │                        │
│──────────│          │──────────│                        │
│ Id       │          │ Id       │                        │
│ UserId   │          │ UserId   │                        │
│ Special. │          │ Notes    │                        │
│ Color    │          │ Emergency│                        │
│ IsActive │          │ IsActive │                        │
└────┬─────┘          └────┬─────┘                        │
     │                     │                              │
     │ 1:N                 │ 1:N                          │
     │                     │                              │
     │                     ▼                              │
     │               ┌──────────────┐    ┌──────────┐    │
     │               │ClientPackage │◄───│ Package  │    │
     │               │──────────────│    │──────────│    │
     │               │ Id           │    │ Id       │    │
     │               │ ClientId     │    │ Name     │    │
     │               │ PackageId    │    │ Sessions │    │
     │               │ Remaining    │    │ Duration │    │
     │               │ PurchaseDate │    │ MaxDays  │    │
     │               │ ExpiryDate   │    │ Price    │    │
     │               │ Status       │    │ IsActive │    │
     │               └──────┬───────┘    └──────────┘    │
     │                      │                             │
     │                      │ 1:N                         │
     │                      ▼                             │
     │               ┌────────────────┐                   │
     │               │CreditAdjustment│                   │
     │               │────────────────│                   │
     │               │ Id             │                   │
     │               │ ClientPkgId    │                   │
     │               │ Amount (+/-)   │                   │
     │               │ Reason         │                   │
     │               │ AdjustedBy     │───────────────────┘
     │               │ CreatedAt      │        (User FK)
     │               └────────────────┘
     │
     │ 1:N
     ▼
┌─────────────┐
│ Appointment │
│─────────────│
│ Id          │
│ TrainerId   │
│ StartTime   │
│ EndTime     │
│ Capacity    │
│ IsGroup     │
│ Status      │
│ Notes       │
│ RecurrenceId│
└──────┬──────┘
       │
       │ 1:N
       ▼
┌───────────────────┐
│ AppointmentClient │
│───────────────────│
│ Id                │
│ AppointmentId     │
│ ClientId          │──────► Client
│ ClientPackageId   │──────► ClientPackage
│ Status            │
│ CancelledAt       │
│ CancelledBy       │
└────────┬──────────┘
         │
         │ 0..1
         ▼
┌────────────┐
│ Attendance │
│────────────│
│ Id         │
│ ApptClntId │
│ CheckInTime│
│ Method     │
└────────────┘


┌──────────┐          ┌──────────┐
│ Setting  │          │ AuditLog │
│──────────│          │──────────│
│ Id       │          │ Id       │
│ Key      │          │ UserId   │
│ Value    │          │ Action   │
│ Desc.    │          │ Entity   │
└──────────┘          │ EntityId │
                      │ Details  │
                      │ CreatedAt│
                      └──────────┘
```

## Enum Degerleri

### UserRole
- Admin = 0
- Trainer = 1
- Client = 2

### PackageStatus (ClientPackage.Status)
- Active = 0
- Completed = 1 (tum dersler kullanildi)
- Expired = 2 (suresi doldu)

### AppointmentStatus (Appointment.Status)
- Scheduled = 0
- Completed = 1
- Cancelled = 2

### AppointmentClientStatus (AppointmentClient.Status)
- Scheduled = 0
- Completed = 1
- Cancelled = 2 (zamaninda iptal — hak iade)
- Burned = 3 (gec iptal veya gelmeme — hak yandi)

### AttendanceMethod
- QR = 0
- Manual = 1

### AuditAction
- Created = 0
- Updated = 1
- Deleted = 2
