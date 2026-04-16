# PtStudio — MVP Gelistirme Plani

## Faz 1: Auth + Kullanici Yonetimi + Paket Tanimlari

### 1.1 Backend Proje Kurulumu
- [x] .NET 9 Web API projesi olustur (`src/api/PtStudio.Api`)
- [x] NuGet paketleri ekle: EF Core (Npgsql), AutoMapper, JWT Bearer, Serilog
- [x] PostgreSQL baglantisi ve AppDbContext olustur
- [x] Program.cs: DI, Auth, CORS, Serilog konfigurasyonu
- [x] Entity'leri olustur: User, Trainer, Client, Package, ClientPackage, Setting, AuditLog
- [x] Enum'lari olustur: UserRole, PackageStatus, vb.
- [x] Initial migration olustur

### 1.2 Auth
- [x] AuthController: Login, Register (admin tarafindan)
- [x] AuthService: JWT token uretimi (HS256)
- [x] Rol bazli [Authorize] attribute kullanimi
- [x] Login DTO, Token response DTO

### 1.3 Kullanici Yonetimi
- [x] UserController: CRUD (admin only)
- [x] TrainerController: Liste, Detay, Guncelle
- [x] ClientController: Liste, Detay, Guncelle
- [x] AutoMapper profilleri
- [x] AuditLog entegrasyonu

### 1.4 Paket Tanimlari
- [x] PackageController: CRUD (admin only)
- [x] ClientPackageController: Satis (Create), Liste, Durum guncelle
- [x] Paket suresi dolma kontrolu (MaxDays → ExpiryDate hesaplama)

### 1.5 Frontend Proje Kurulumu
- [x] Next.js projesi olustur (`src/web`)
- [x] shadcn/ui + Tailwind CSS kurulumu
- [x] API client (axios/fetch wrapper) olustur
- [x] Auth context + JWT token yonetimi
- [x] Layout: Sidebar + Header (rol bazli menu)
- [x] Login sayfasi

### 1.6 Frontend Sayfalari (Faz 1)
- [x] Yonetici: Kullanici listesi + ekleme/duzenleme dialog
- [x] Yonetici: Antrenor listesi
- [x] Yonetici: Musteri listesi
- [x] Yonetici: Paket tanimlari sayfasi
- [x] Yonetici: Musteriye paket satisi sayfasi
- [x] Antrenor: Kendi musteri listesi
- [x] Musteri: Paketlerim / kalan haklar sayfasi

---

## Faz 2: Randevu Olusturma + Takvim Gorunumu

### 2.1 Backend
- [x] Appointment entity ve migration
- [x] AppointmentClient entity (many-to-many)
- [x] AppointmentController: CRUD
- [x] Tekrarlayan randevu olusturma endpoint'i (RecurrenceGroupId)
- [x] Tekrarlayan randevu silme: tekli / toplu secenegi
- [x] Grup seansi: Capacity kontrolu
- [x] Antrenor musaitlik kontrolu (cakisma engelleme)
- [x] Randevu listeleme: tarihe gore, antrenore gore, musteriye gore

### 2.2 Frontend
- [x] FullCalendar entegrasyonu
- [x] Yonetici takvimi: tum antrenorlerin randevulari (renk kodlu)
- [x] Antrenor takvimi: sadece kendi randevulari
- [x] Musteri takvimi: sadece kendi dersleri
- [x] Randevu olusturma dialog'u
- [x] Tekrarlayan randevu sihirbazi (gun secimi, kac hafta, saat)
- [x] Randevu detay/duzenleme popup
- [x] Grup seansi gorunumu (kac kisi / kapasite)

---

## Faz 3: QR Check-in + Iptal/Yanma Mantigi

### 3.1 Backend
- [x] AttendanceController: Check-in endpoint
- [x] QR icin salon bazli unique token uretimi
- [x] Check-in zaman kontrolu (ders saatine ±15 dk)
- [x] Iptal endpoint'i: sure kontrolu (Setting'den CancellationWindowHours)
- [x] Gec iptal → AppointmentClient.Status = Burned
- [x] Ders tamamlama: RemainingSessions dusurme
- [x] CreditAdjustmentController: yonetici insiyatif ders ekleme
- [x] Otomatik yanma: ders saati gectiginde gelmeyenleri "Burned" yap (background job veya endpoint)

### 3.2 Frontend
- [x] QR check-in sayfasi (musteri telefonundan acilir)
- [x] "Derse Geldim" butonu + onay ekrani
- [x] Musteri: derslerim sayfasinda durum gosterimi (tamamlandi/iptal/yandi)
- [x] Yonetici: randevu detayinda check-in durumu
- [x] Yonetici: insiyatif ders ekleme dialog'u (neden girisi)
- [x] Iptal butonu + uyari mesaji ("X saat icerisinde iptal etmezseniz dersiniz yanacak")
- [x] Yonetici: ayarlar sayfasi (iptal suresi, ders suresi vb.)

---

## Faz 4: Raporlar + Dashboard

### 4.1 Backend
- [x] DashboardController: gunluk/haftalik ozet verileri
- [x] ReportController: antrenor bazli, musteri bazli, gelir, iptal raporlari
- [x] Tarih aralikli filtreleme
- [x] Excel export (ClosedXML)

### 4.2 Frontend
- [x] Yonetici dashboard: bugunun dersleri, aktif musteri sayisi, aylik gelir, iptal orani
- [x] Antrenor bazli ders raporu (tablo + grafik)
- [x] Musteri bazli hak durumu raporu
- [x] Gelir raporu (paket satislari, aylik kiyaslama)
- [x] Iptal/yanma istatistikleri

---

## Notlar

- Her faz kendi icinde bagimsiz deploy edilebilir olmali
- Faz 1 tamamlanmadan Faz 2'ye gecme
- Her fazin sonunda calisan bir urun olmali
- Veritabani migration'lari EF Core Code-First ile yonetilecek
