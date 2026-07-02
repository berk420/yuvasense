# YuvaSense

Kreş (anaokulu/daycare) yönetim sistemi. Çocuk kayıt ve profil yönetimi, devam/yoklama takibi, personel ve sınıf yönetimi, veli portalı ve faturalandırma içeren bir MVP.

Bu repo, uygulamanın kendisidir (backend + admin/öğretmen paneli + veli portalı). Tanıtım/landing sitesi ayrı bir repoda yaşar: [yuvasense-tanitim](https://github.com/) (bkz. dağıtım notları).

## Teknoloji

- **Backend:** Node.js + Express
- **Veritabanı:** [lowdb](https://github.com/typicode/lowdb) v1 — JSON dosyasına yazan, native derleme gerektirmeyen basit bir DB. MVP için yeterli, ileride Postgres/Prisma'ya taşınabilir.
- **Kimlik doğrulama:** `express-session` (cookie tabanlı) + `bcryptjs` (parola hash)
- **Frontend:** Derlemesiz, sade HTML/CSS/JS (çoklu sayfa uygulaması). Build adımı yok.
- **Süreç yönetimi:** PM2 (`ecosystem.config.js`)

## Roller

- **admin** (Yönetici) — her şeye erişir: sınıflar, çocuklar, personel, yoklama, faturalandırma, veliler, demo talepleri.
- **teacher** (Öğretmen) — sınıflar, çocuklar, personel (görüntüleme), yoklama.
- **parent** (Veli) — yalnızca kendi çocuklarının profili, yoklama geçmişi ve faturalarını görür (`/parent-portal`).

## Kurulum

```bash
npm install
npm start          # http://localhost:4101
```

İlk açılışta veritabanı boşsa (`data/db.json` yoksa veya `meta.seeded` false ise) örnek veri otomatik oluşturulur — manuel seed adımı gerekmez. Elle yeniden seed etmek için:

```bash
npm run seed
```

## Demo hesapları

| Rol | E-posta | Şifre |
|---|---|---|
| Yönetici | admin@yuvasense.com.tr | Yonetici2026! |
| Öğretmen | ayse.demir@yuvasense.com.tr | Ogretmen2026! |
| Veli | (Veliler listesinden bir e-posta seçin) | Veli2026! |

## Ortam değişkenleri

`ecosystem.config.js` / `.env` üzerinden:

- `PORT` — varsayılan 4101
- `SESSION_SECRET` — **prod'da değiştirilmeli**
- `NODE_ENV`

CORS, `src/config.js` içindeki `corsOrigins` listesiyle kontrol edilir; tanıtım sitesinin demo formu buradan bu backend'e (`/api/public/demo-request`) istek atar.

## Dağıtım (PM2 + IIS reverse proxy + Cloudflare Tunnel)

1. Sunucuda `npm install --omit=dev` çalıştırın (native bağımlılık yok, Windows'ta sorunsuz kurulmalı).
2. `pm2 start ecosystem.config.js` ile başlatın, `pm2 save` ile kalıcı hale getirin.
3. IIS'te `yuvasense.testprocess.com.tr` için bir site/binding oluşturup `localhost:4101`'e reverse proxy yapın (ARR + URL Rewrite, diğer testprocess.com.tr projeleriyle aynı desen).
4. Cloudflare Tunnel (`hp650`) üzerinden `yuvasense.testprocess.com.tr` rotasını IIS'e yönlendirin.

## API uç noktaları (özet)

- `POST /api/auth/login`, `POST /api/auth/parent-login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/classrooms`
- `GET/POST/PUT/DELETE /api/children`, `POST /api/children/:id/parents`
- `GET/POST/PUT/DELETE /api/staff`
- `GET /api/attendance`, `GET /api/attendance/child/:id`, `POST /api/attendance`
- `GET/POST/PUT/DELETE /api/invoices`, `PUT /api/invoices/:id/mark-paid`
- `GET/POST/PUT/DELETE /api/parents`, `GET /api/parents/me/children`
- `GET /api/dashboard/summary`
- `POST /api/public/demo-request` (auth gerektirmez — tanıtım sitesi formu), `GET /api/public/demo-requests`, `GET /api/public/health`

## Proje yapısı

```
src/
  app.js, config.js
  db/         (lowdb adapter + seed script)
  middleware/ (auth guards)
  routes/     (her kaynak için bir router)
  utils/
public/       (statik admin/öğretmen paneli + /parent-portal)
server.js
ecosystem.config.js
```
