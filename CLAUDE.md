# PtStudio — PT Salon Randevu Takip ve Yonetim Sistemi

SaaS-ready personal training studio yonetim uygulamasi. MVP'de tek salon, ileride multi-tenant.

---

## Proje Yapisi

```
pt-studio/
├── src/
│   ├── api/                        # .NET 9 Web API
│   │   ├── PtStudio.Api/
│   │   │   ├── Controllers/
│   │   │   ├── Services/
│   │   │   ├── Models/
│   │   │   ├── DTOs/
│   │   │   ├── Data/
│   │   │   ├── Enums/
│   │   │   └── Program.cs
│   │   └── PtStudio.Api.sln
│   │
│   └── web/                        # Next.js + shadcn/ui + Tailwind
│       ├── app/
│       │   ├── (auth)/login/
│       │   ├── (dashboard)/        # Yonetici paneli
│       │   ├── (trainer)/          # Antrenor paneli
│       │   └── (client)/           # Musteri paneli
│       ├── components/
│       ├── lib/
│       └── package.json
│
├── docs/
│   ├── plan.md
│   └── entity-diagram.md
│
├── .gitignore
├── README.md
└── CLAUDE.md
```

---

## Tech Stack

- **Backend:** .NET 9 Web API, EF Core, PostgreSQL
- **Frontend:** Next.js 14+ (App Router), React, shadcn/ui, Tailwind CSS, FullCalendar
- **Auth:** JWT (HS256), rol bazli (Admin, Trainer, Client)
- **Monorepo:** Backend ve frontend ayni repoda, deploy ayri

---

## Calistirma

```bash
# Backend
cd src/api/PtStudio.Api
dotnet run

# Frontend
cd src/web
npm install
npm run dev
```

---

## Kullanici Rolleri

| Rol | Yetkiler |
|-----|----------|
| **Admin** | Tam yetki: tum takvim, raporlar, paket tanimlari, ucret takibi, insiyatif ders ekleme, ayarlar |
| **Trainer** | Kendi randevulari, kendi musterileri |
| **Client** | Kendi dersleri, kalan haklari, QR check-in |

---

## Entity Yapisi

```
User
  Id, FullName, Email, Phone, PasswordHash,
  Role(Admin/Trainer/Client), IsActive, CreatedAt

Trainer
  Id, UserId(FK), Specialization, Color, IsActive

Client
  Id, UserId(FK), Notes, EmergencyContact, IsActive

Package
  Id, Name, SessionCount, DefaultDurationMinutes(=60),
  MaxDays(?), Price, IsActive

ClientPackage
  Id, ClientId(FK), PackageId(FK), RemainingSessions,
  PurchaseDate, ExpiryDate(?), Status(Active/Completed/Expired)

Appointment
  Id, TrainerId(FK), StartTime, EndTime,
  Capacity(=1), IsGroup, Status(Scheduled/Completed/Cancelled),
  Notes, RecurrenceGroupId(?)

AppointmentClient
  Id, AppointmentId(FK), ClientId(FK), ClientPackageId(FK),
  Status(Scheduled/Completed/Cancelled/Burned),
  CancelledAt, CancelledBy

Attendance
  Id, AppointmentClientId(FK), CheckInTime, Method(QR/Manual)

CreditAdjustment
  Id, ClientPackageId(FK), Amount(+1/-1), Reason,
  AdjustedByUserId(FK), CreatedAt

Setting
  Id, Key, Value, Description

AuditLog
  Id, UserId, Action, EntityType, EntityId,
  Details(JSON), CreatedAt
```

---

## Is Kurallari

### Paketler
- Paket = ders sayisi + opsiyonel maksimum gun
- Musteri bir paket satin aldiginda ClientPackage olusur, RemainingSessions = Package.SessionCount
- MaxDays varsa ExpiryDate = PurchaseDate + MaxDays, yoksa ExpiryDate null
- Suresi dolan paketler icin sistem uyari verir, otomatik silmez — yonetici karar verir

### Randevular
- Randevu = bir antrenor + bir veya birden fazla musteri (Capacity ile kontrol)
- Normal seans: Capacity=1, IsGroup=false
- Grup seansi: Capacity>1, IsGroup=true
- Tekrarlayan randevular RecurrenceGroupId ile gruplanir
- Tekrarlayan randevu silindiginde "sadece bu mu, hepsi mi?" secenegi sunulur

### Iptal ve Yanma
- Setting tablosunda "CancellationWindowHours" (varsayilan: 6)
- Musteri ders saatinden X saat once iptal ederse: ders yanmaz, hak iade edilir
- Gec iptal veya gelmeme: ders yanar (AppointmentClient.Status = Burned)
- Yonetici insiyatif ile CreditAdjustment(+1) yapabilir, neden girilir, loglanir

### QR Check-in
- Salonda sabit QR kod bulunur
- Musteri telefonuyla okur → web sayfasi acilir → giris yapmissa "Derse Geldim" basar
- Zaman kontrolu: ders saatine ±15 dk icerisinde check-in yapilabilir
- Check-in yapildiginda Attendance kaydedilir, AppointmentClient.Status = Completed

### Loglama
- Tum CUD islemleri AuditLog tablosuna yazilir
- CreditAdjustment ayri tablo — raporlama icin onemli
- Iptal islemleri AppointmentClient uzerinde CancelledAt/CancelledBy ile takip edilir

---

## Gelistirme Kurallari

### Genel
- Domain terimleri **Ingilizce** (entity, property, DTO, enum, degisken)
- UI metinleri ve hata mesajlari **Turkce**
- Soft delete: `IsActive = false` (fiziksel silme yapma)
- Her CUD isleminde AuditLog kaydi olustur
- appsettings dosyalarini izinsiz okuma — hassas bilgi icerir

### Backend
- Her endpoint `AppDbContext` uzerinden calisir
- Controller → Service → DbContext katmani
- DTO'larda gereksiz navigation property dahil etme
- Hata: `_logger.LogError(ex, JsonConvert.SerializeObject(dto))`

### Frontend
- `console.log` kullanma — bildirimler toast/alert uzerinden
- API hatalari kullaniciya anlamli mesajla gosterilir
- Responsive tasarim — tablet ve mobil tarayicida da calismali (QR check-in icin)

### Yapma Listesi
- Mevcut mimariyi degistirme (yeni pattern, yeni kutuphane ekleme) — talep edilmedikce
- Var olan controller/service yapisini refactor etme — talep edilmedikce
- Yorum veya docstring ekleme — mevcut kodda yoksa ekleme
- Gereksiz null-check, try-catch, validation ekleme — mevcut deseni takip et
- Test dosyasi olusturma — proje basta test altyapisi olmadan ilerleyecek

---

## MVP Fazlari

### Faz 1: Auth + Kullanici Yonetimi + Paket Tanimlari
- JWT auth (login/register)
- Rol bazli yetkilendirme (Admin/Trainer/Client)
- Kullanici CRUD (admin)
- Antrenor ve musteri profil yonetimi
- Paket tanimlari CRUD
- Musteriye paket satisi (ClientPackage)

### Faz 2: Randevu Olusturma + Takvim Gorunumu
- Randevu CRUD
- Tekrarlayan randevu sihirbazi
- Grup seansi destegi
- Takvim gorunumu (Admin: tum antrenorler, Trainer: kendi, Client: kendi)
- FullCalendar entegrasyonu

### Faz 3: QR Check-in + Iptal/Yanma Mantigi
- QR kod uretimi (salona ozel sabit QR)
- Check-in sayfasi ve akisi
- Iptal politikasi uygulamasi (parametrik sure)
- Ders yanma otomasyonu
- Yonetici insiyatif ders ekleme (CreditAdjustment)

### Faz 4: Raporlar + Dashboard
- Yonetici dashboard (gunluk/haftalik ozet)
- Antrenor bazli ders raporu
- Musteri bazli hak durumu raporu
- Gelir raporu (paket satislari)
- Iptal/yanma istatistikleri

---

## Kontrol Listesi — PR Oncesi

- [ ] IsActive filtresi var mi? (soft delete)
- [ ] AuditLog kaydi olusuyor mu? (Create, Update, Delete)
- [ ] CreditAdjustment loglanmis mi?
- [ ] DTO'da gereksiz navigation property yok mu?
- [ ] Frontend'de hata mesaji kullaniciya gosteriliyor mu?
- [ ] Responsive calisiyor mu?
