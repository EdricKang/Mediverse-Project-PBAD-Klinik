# Mediverse — Backend Sistem Appointment Klinik

Backend ini menyediakan REST API untuk mengelola pasien, dokter, ruangan praktik, jadwal dokter, dan janji temu (*appointment*). Backend dibangun menggunakan **Node.js**, **Express**, dan **SQLite**.

Panduan ini ditujukan untuk anggota kelompok yang ingin mengambil kode dari GitHub, menjalankan backend di komputer masing-masing, dan menguji API menggunakan Postman.

> **Catatan data demo:** repository dapat menyertakan `database.sqlite` agar anggota kelompok memulai dari salinan data demo yang sama. Gunakan hanya data palsu/dummy. Jangan memasukkan data pasien nyata atau informasi pribadi ke database yang dibagikan.

## Daftar Isi

1. [Fitur Utama](#fitur-utama)
2. [Teknologi](#teknologi)
3. [Struktur Folder](#struktur-folder)
4. [Persyaratan](#persyaratan)
5. [Mengunduh Proyek](#mengunduh-proyek)
6. [Menyiapkan Konfigurasi](#menyiapkan-konfigurasi)
7. [Menjalankan Backend](#menjalankan-backend)
8. [Menguji API](#menguji-api)
9. [Daftar Endpoint](#daftar-endpoint)
10. [Contoh Request](#contoh-request)
11. [Aturan Bisnis](#aturan-bisnis)
12. [Database dan Data Demo](#database-dan-data-demo)
13. [Format Respons API](#format-respons-api)
14. [Troubleshooting](#troubleshooting)
15. [Catatan Pengembangan dan Keamanan](#catatan-pengembangan-dan-keamanan)

## Fitur Utama

- Membaca, menambahkan, memperbarui, dan menghapus data pasien.
- Membaca data dokter, menambahkan dan memperbarui data dokter, serta mengaktifkan/menonaktifkan dokter.
- Membaca daftar ruangan praktik.
- Mengelola jadwal praktik dokter berdasarkan hari dan jam.
- Membuat dan memperbarui appointment.
- Memperbarui status appointment.
- Memvalidasi tanggal, waktu, jadwal dokter, status aktif dokter, dan konflik slot saat appointment dibuat atau diperbarui.
- Membuat `booking_code` otomatis untuk appointment baru.
- Menyimpan data pada SQLite.

## Teknologi

- Node.js dan npm
- Express
- SQLite (`sqlite3`)
- dotenv untuk membaca konfigurasi dari `.env`
- CORS untuk menerima request dari client lain
- Nodemon untuk menjalankan server selama pengembangan

## Struktur Folder

Struktur utama backend:

```text
backend/
├── database.sqlite              # Database demo lokal/bersama (jika tersedia di repo)
├── .env                         # Konfigurasi lokal; tidak perlu di-commit
├── .env.example                 # Contoh konfigurasi yang aman dibagikan
├── package.json                 # Dependencies dan perintah menjalankan server
├── package-lock.json
├── server.js                    # Entry point Express dan pendaftaran routes
├── readme.md                    # Panduan ini
└── src/
    ├── config/
    │   ├── database.js          # Membuka SQLite dan menginisialisasi database
    │   └── migrations.js        # Migrasi/perubahan skema database
    ├── controllers/             # Validasi request dan respons API
    ├── middlewares_helpers/     # Helper query SQLite
    ├── models/                   # Query dan operasi database
    ├── routes/                   # Pemetaan URL ke controller
    └── sql_scripts/
        └── init.sql             # Skema awal tabel dan indeks
```

Alur request secara sederhana:

```text
Client (Postman / Web / Mobile / Desktop)
                |
                v
        Express Routes
                |
                v
          Controllers
     (validasi dan respons)
                |
                v
            Models
                |
                v
       SQLite Helper / SQLite
                |
                v
       backend/database.sqlite
```

Semua client menggunakan REST API. Client tidak perlu membuka atau mengakses file SQLite secara langsung.

## Persyaratan

Sebelum memulai, siapkan:

- Node.js dan npm yang sudah terpasang.
- Git untuk mengunduh repository (atau unduh ZIP repository dari GitHub).
- Postman atau Thunder Client untuk pengujian API.

Periksa instalasi Node.js dan npm di Command Prompt (CMD):

```cmd
node -v
npm -v
```

Jika kedua perintah menampilkan nomor versi, lanjutkan ke langkah berikutnya.

## Mengunduh Proyek

### Opsi A — menggunakan Git

Buka CMD pada folder tempat kamu menyimpan proyek, kemudian jalankan:

```cmd
git clone https://github.com/EdricKang/Mediverse-Project-PBAD-Klinik.git
cd Mediverse-Project-PBAD-Klinik\backend
```

Jika nama repository atau alamatnya berubah, gunakan alamat clone yang tertera pada halaman GitHub proyek.

### Opsi B — mengunduh ZIP

1. Buka repository GitHub.
2. Klik **Code** lalu pilih **Download ZIP**.
3. Ekstrak ZIP.
4. Buka CMD di folder hasil ekstraksi, kemudian masuk ke folder `backend`.

Pastikan lokasi terminal saat menjalankan perintah berikut adalah folder `backend`—folder yang memiliki `package.json` dan `server.js`.

## Menyiapkan Konfigurasi

File `.env.example` adalah contoh konfigurasi. Untuk konfigurasi yang dibahas saat ini, isinya:

```env
PORT=3000
```

Buat file `.env` lokal berdasarkan contoh tersebut.

**Windows CMD:**

```cmd
copy .env.example .env
```

**PowerShell atau terminal macOS/Linux:**

```bash
cp .env.example .env
```

Jika file `.env` sudah ada, tidak perlu membuatnya ulang. Pastikan nilainya sesuai kebutuhan lokal.

Server juga mempunyai nilai default `3000`, sehingga jika `PORT` tidak ditentukan, server mencoba berjalan pada port tersebut. `.env` tidak berisi database dan tidak menggantikan file SQLite.

> Jangan mengganti nama `.env.example` menjadi `.env.example.txt`. Di Windows, aktifkan tampilan ekstensi file jika perlu untuk memastikan nama file benar.

## Menjalankan Backend

### 1. Instal dependensi

Dari folder `backend`, jalankan:

```cmd
npm install
```

Perintah ini mengunduh paket sesuai `package.json` dan `package-lock.json`. Proses ini perlu dilakukan pada komputer baru; folder `node_modules` tidak perlu disimpan di GitHub.

### 2. Jalankan dalam mode pengembangan

```cmd
npm run dev
```

Script ini menggunakan Nodemon agar server dapat dimulai ulang saat file backend berubah.

### 3. Alternatif menjalankan server

```cmd
npm start
```

Perintah tersebut menjalankan `node server.js`.

Jika startup berhasil, terminal akan menampilkan pesan bahwa SQLite terhubung, migrasi berhasil diterapkan, dan API berjalan di alamat yang menyerupai:

```text
http://localhost:3000
```

Biarkan terminal tersebut tetap terbuka selama API digunakan. Untuk menghentikan server, tekan **Ctrl + C** pada terminal.

## Menguji API

Base URL lokal:

```text
http://localhost:3000
```

### Pemeriksaan pertama

1. Jalankan server sesuai bagian sebelumnya.
2. Buka browser atau Postman.
3. Kirim request berikut:

```http
GET http://localhost:3000/
```

Jika server hidup, endpoint root mengembalikan respons JSON dengan `success: true` dan pesan bahwa Clinic Appointment API berjalan.

### Cek data yang tersedia

Jalankan request GET berikut satu per satu di Postman:

```http
GET http://localhost:3000/api/patients
GET http://localhost:3000/api/doctors
GET http://localhost:3000/api/rooms
GET http://localhost:3000/api/doctor-schedules
GET http://localhost:3000/api/appointments
```

Respons yang berisi array kosong belum tentu berarti server gagal; bisa jadi database tidak mempunyai data pada tabel tersebut. Jika `database.sqlite` disertakan di versi repository yang di-clone, hasil awal semestinya mengikuti isi database pada commit tersebut, setelah inisialisasi/migrasi berjalan.

### Pengaturan Postman

Untuk request yang mengirim JSON:

1. Pilih method (misalnya `POST`, `PUT`, atau `PATCH`).
2. Masukkan URL endpoint yang tepat.
3. Buka tab **Body** → pilih **raw** → pilih **JSON**.
4. Masukkan body JSON sesuai contoh endpoint.
5. Klik **Send** dan periksa status HTTP serta respons JSON.

## Daftar Endpoint

Semua path di tabel ini relatif terhadap `http://localhost:3000`.

### Pasien — `/api/patients`

| Method | Endpoint | Kegunaan |
|---|---|---|
| `GET` | `/api/patients` | Mengambil seluruh pasien. |
| `GET` | `/api/patients/:id` | Mengambil pasien berdasarkan ID. |
| `POST` | `/api/patients` | Menambahkan pasien. |
| `PUT` | `/api/patients/:id` | Memperbarui kolom pasien yang dikirim. |
| `DELETE` | `/api/patients/:id` | Menghapus pasien jika tidak terhalang relasi data. |

### Dokter — `/api/doctors`

| Method | Endpoint | Kegunaan |
|---|---|---|
| `GET` | `/api/doctors` | Mengambil seluruh dokter. |
| `GET` | `/api/doctors/:id` | Mengambil dokter berdasarkan ID. |
| `POST` | `/api/doctors` | Menambahkan dokter dengan ruangan yang valid dan belum digunakan dokter lain. |
| `PUT` | `/api/doctors/:id` | Memperbarui data dokter. |
| `PATCH` | `/api/doctors/:id/status` | Mengaktifkan atau menonaktifkan dokter. |

### Ruangan — `/api/rooms`

| Method | Endpoint | Kegunaan |
|---|---|---|
| `GET` | `/api/rooms` | Mengambil daftar ruangan, termasuk informasi dokter yang terhubung jika tersedia. |
| `GET` | `/api/rooms/:id` | Mengambil satu ruangan berdasarkan ID. |

Pada implementasi saat ini, endpoint ruangan hanya menyediakan operasi baca (GET). Penambahan, pengubahan, dan penghapusan ruangan belum tersedia melalui routes ini.

### Jadwal praktik — `/api/doctor-schedules`

| Method | Endpoint | Kegunaan |
|---|---|---|
| `GET` | `/api/doctor-schedules` | Mengambil daftar jadwal; dapat difilter dengan query parameter. |
| `GET` | `/api/doctor-schedules/:id` | Mengambil jadwal berdasarkan ID. |
| `POST` | `/api/doctor-schedules` | Menambahkan jadwal praktik. |
| `PUT` | `/api/doctor-schedules/:id` | Memperbarui jadwal praktik. |
| `PATCH` | `/api/doctor-schedules/:id/status` | Mengaktifkan atau menonaktifkan jadwal. |

Query parameter yang didukung untuk GET daftar jadwal:

```text
/api/doctor-schedules?doctor_id=1
/api/doctor-schedules?day_of_week=1
/api/doctor-schedules?is_active=1
/api/doctor-schedules?doctor_id=1&day_of_week=1&is_active=1
```

Keterangan `day_of_week`: `1=Senin`, `2=Selasa`, `3=Rabu`, `4=Kamis`, `5=Jumat`, `6=Sabtu`, `7=Minggu`.

### Appointment — `/api/appointments`

| Method | Endpoint | Kegunaan |
|---|---|---|
| `GET` | `/api/appointments` | Mengambil daftar appointment dan mendukung filter. |
| `GET` | `/api/appointments/:id` | Mengambil detail appointment. |
| `POST` | `/api/appointments` | Membuat appointment dengan kode booking otomatis. |
| `PUT` | `/api/appointments/:id` | Memperbarui data appointment yang masih dapat diubah. |
| `PATCH` | `/api/appointments/:id/status` | Memperbarui status appointment dengan aturan transisi. |

Filter untuk GET daftar appointment:

```text
/api/appointments?date=YYYY-MM-DD
/api/appointments?patient_id=1
/api/appointments?doctor_id=1
/api/appointments?status=pending
/api/appointments?date=YYYY-MM-DD&doctor_id=1&status=confirmed
```

Status yang didukung: `pending`, `confirmed`, `completed`, dan `cancelled`.

### Endpoint template lama

Source masih mendaftarkan `/api/products` dan `/api/test` dari template awal. Endpoint tersebut bukan alur utama sistem klinik dan tidak diperlukan untuk menguji alur appointment. Respons daftar endpoint pada `GET /` juga mungkin belum menampilkan seluruh route klinik; gunakan tabel README ini sebagai daftar endpoint yang dipasang pada `server.js`.

## Contoh Request

Semua contoh berikut dikirim melalui Postman dengan **Body → raw → JSON**. Ganti ID dengan ID yang benar-benar tersedia di database lokal. Khusus appointment, ganti tanggal dan jam dengan jadwal praktik aktif yang masih berada di masa mendatang.

### 1. Menambahkan pasien

`POST /api/patients`

```json
{
  "full_name": "Dina Pratama",
  "phone": "081234567899",
  "email": "dina.pratama@klinik.test",
  "date_of_birth": "2000-03-15",
  "gender": "Perempuan",
  "address": "Medan"
}
```

`full_name` dan `phone` wajib diisi. Field lainnya bersifat opsional.

### 2. Menambahkan dokter

`POST /api/doctors`

```json
{
  "title_prefix": "dr.",
  "full_name": "Contoh Nama Dokter",
  "title_suffix": null,
  "specialization": "Dokter Umum",
  "phone": "081234567898",
  "email": "dokter@klinik.test",
  "room_id": 3
}
```

Ganti `room_id` dengan ID ruangan yang ada dan belum dipakai dokter lain. Untuk mengetahui ID ruangan, jalankan `GET /api/rooms`. Nama dan gelar pada contoh hanya data dummy.

### 3. Menambahkan jadwal praktik

`POST /api/doctor-schedules`

```json
{
  "doctor_id": 1,
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "12:00",
  "slot_duration_minutes": 30,
  "is_active": 1
}
```

Pastikan dokter dengan ID tersebut ada. Contoh di atas berarti jadwal Senin pukul 09.00 sampai 12.00 dengan durasi slot 30 menit. Jadwal aktif yang bertumpang tindih untuk dokter dan hari yang sama akan ditolak.

### 4. Membuat appointment

`POST /api/appointments`

```json
{
  "patient_id": 1,
  "doctor_id": 1,
  "appointment_date": "YYYY-MM-DD",
  "appointment_time": "09:00",
  "complaint": "Pemeriksaan umum"
}
```

`YYYY-MM-DD` adalah placeholder, bukan tanggal yang bisa langsung digunakan. Ganti dengan tanggal masa depan yang sesuai hari jadwal dokter. `appointment_time` harus tepat pada awal slot yang valid (misalnya `09:00`, lalu `09:30` untuk slot 30 menit) dan slot harus seluruhnya berada dalam jam praktik.

Backend membuat `booking_code` secara otomatis dan status awal `pending`. Jangan mengirim `booking_code` atau `status` saat membuat appointment; keduanya dikelola backend.

### 5. Mengubah status dokter

`PATCH /api/doctors/1/status`

```json
{
  "is_active": false
}
```

Gunakan `true` untuk mengaktifkan kembali dokter. Dokter nonaktif tidak dapat menerima appointment baru.

### 6. Mengubah status jadwal

`PATCH /api/doctor-schedules/1/status`

```json
{
  "is_active": 0
}
```

Gunakan `1` untuk aktif dan `0` untuk nonaktif.

### 7. Mengubah status appointment

`PATCH /api/appointments/1/status`

```json
{
  "status": "confirmed"
}
```

Transisi status yang diizinkan:

- `pending` → `confirmed` atau `cancelled`
- `confirmed` → `completed` atau `cancelled`
- `completed` → tidak dapat diubah ke status lain
- `cancelled` → tidak dapat diubah ke status lain

Gunakan ID appointment yang benar-benar ada di database.

### 8. Memperbarui appointment

`PUT /api/appointments/1`

```json
{
  "patient_id": 1,
  "doctor_id": 1,
  "appointment_date": "YYYY-MM-DD",
  "appointment_time": "09:30",
  "complaint": "Kontrol lanjutan"
}
```

Untuk endpoint ini, kirim `patient_id`, `doctor_id`, `appointment_date`, dan `appointment_time` yang valid. `complaint` boleh berupa teks atau `null`. Appointment yang sudah `completed` atau `cancelled` tidak dapat diubah. Kode booking tidak perlu dikirim karena dipertahankan oleh backend.

## Aturan Bisnis

- Semua tanggal appointment menggunakan format `YYYY-MM-DD`.
- Semua jam menggunakan format 24 jam `HH:MM`.
- Appointment tidak boleh dibuat pada tanggal lampau atau pada waktu yang sudah lewat hari ini.
- Dokter harus terdaftar dan berstatus aktif.
- Tanggal harus cocok dengan hari praktik aktif dokter.
- Waktu appointment harus sama dengan awal slot dan slotnya harus berada sepenuhnya di dalam jam praktik.
- Durasi slot ditentukan oleh `slot_duration_minutes`, dengan default 30 menit saat membuat jadwal.
- Jadwal praktik aktif yang tumpang tindih untuk dokter/hari yang sama ditolak.
- Database mencegah appointment `pending` atau `confirmed` menggunakan slot dokter yang sama pada tanggal dan jam yang sama. Appointment aktif pasien pada slot yang sama juga dicegah.
- Kode booking dibuat otomatis. Pada database lama, migrasi dapat memberi kode pada appointment yang belum memilikinya.
- Hari praktik menggunakan angka 1 sampai 7, Senin sampai Minggu.

## Database dan Data Demo

Database disimpan di:

```text
backend/database.sqlite
```

Lokasinya ditetapkan di konfigurasi backend dan tidak bergantung pada variabel `PORT` di `.env`.

Saat server dijalankan, `database.js` membuka database, mengeksekusi skema awal `src/sql_scripts/init.sql`, lalu menerapkan migrasi yang diperlukan. Jika database sudah ada, data yang tersimpan dipakai; operasi `CREATE TABLE IF NOT EXISTS` tidak dengan sendirinya menghapus data yang sudah ada. Migrasi dapat mengubah struktur database, jadi lakukan backup sebelum perubahan skema yang besar.

Karena database demo dibagikan melalui GitHub, anggota kelompok mendapatkan salinan database dari commit yang di-clone. Perubahan yang dibuat di database komputer satu anggota tidak otomatis tersinkron ke anggota lain.

Sebelum menjalankan tes yang mengubah atau menghapus banyak data, salin `database.sqlite` sebagai backup. Jangan mengedit atau mengganti file database ketika server sedang berjalan.

Jika `database.sqlite` tidak ada, SQLite akan membuat file database baru saat koneksi dibuka, lalu inisialisasi dan migrasi mencoba menyiapkan tabel. Namun, data demo dari anggota lain tidak akan ada pada database baru tersebut.

## Format Respons API

Sebagian besar controller mengembalikan JSON dengan pola seperti berikut.

Respons berhasil:

```json
{
  "success": true,
  "message": "Berhasil mengambil daftar ruangan",
  "data": []
}
```

Respons gagal:

```json
{
  "success": false,
  "message": "ID dokter tidak valid"
}
```

Bentuk `error` dapat tersedia pada beberapa respons validasi. Periksa respons endpoint tertentu untuk melihat isi sebenarnya.

Status HTTP yang umum:

| Status | Arti |
|---|---|
| `200 OK` | Request berhasil. |
| `201 Created` | Data baru berhasil dibuat. |
| `400 Bad Request` | Input tidak valid atau melanggar aturan bisnis. |
| `404 Not Found` | Data yang diminta tidak ditemukan. |
| `409 Conflict` | Konflik, misalnya slot appointment bentrok atau ruangan telah digunakan. |
| `500 Internal Server Error` | Terjadi kesalahan server; periksa terminal backend. |

## Troubleshooting

### `npm` atau `node` tidak dikenali

Node.js belum terpasang atau belum masuk PATH. Pasang Node.js, tutup lalu buka kembali CMD, dan ulangi `node -v` serta `npm -v`.

### `Cannot find module ...`

Pastikan terminal berada di folder `backend`, kemudian jalankan:

```cmd
npm install
```

### Port 3000 sudah digunakan

Hentikan program lain yang menggunakan port tersebut atau ubah `PORT` pada file `.env` lokal, misalnya `PORT=3001`. Jika port diubah ke 3001, base URL menjadi `http://localhost:3001`.

### Postman menampilkan `ECONNREFUSED`

Pastikan server sedang berjalan, URL dan port benar, dan terminal belum ditutup. Request harus dikirim ke alamat yang sama dengan alamat server yang sedang berjalan.

### API mengembalikan array kosong

Periksa apakah database yang digunakan berisi data. Array kosong dapat berarti tabel belum berisi data, bukan berarti API mati.

### Muncul `404 Endpoint tidak ditemukan`

Periksa HTTP method dan URL. Pastikan ejaan route benar, termasuk tanda hubung pada `/api/doctor-schedules`.

### Appointment ditolak dengan status `400`

Periksa bahwa tanggal valid dan mendatang, waktu memakai format `HH:MM`, dokter aktif, hari tersebut memiliki jadwal aktif, serta waktu merupakan awal slot yang tersedia.

### Appointment ditolak dengan status `409`

Slot tersebut kemungkinan sudah digunakan oleh appointment berstatus `pending` atau `confirmed`. Pilih slot lain atau periksa data appointment yang sudah ada.

### Database mengalami masalah atau muncul error SQL

1. Hentikan server dengan `Ctrl + C`.
2. Buat backup `database.sqlite` sebelum mencoba perbaikan.
3. Simpan pesan error dari terminal.
4. Periksa apakah file database benar-benar berada di `backend/database.sqlite`.
5. Jangan langsung menghapus database, karena tindakan tersebut dapat menghilangkan data demo.

## Catatan Pengembangan dan Keamanan

- Repository private tetap dapat diakses oleh semua kolaborator yang diundang; jangan menyimpan data pasien nyata di database demo.
- `database.sqlite` dibagikan untuk memudahkan pengujian data awal. Setiap anggota memiliki salinan tersendiri setelah clone.
- `.env` adalah konfigurasi lokal dan sebaiknya tidak di-commit. Bagikan `.env.example` tanpa rahasia.
- `node_modules` tidak perlu diunggah; setiap anggota menginstal dependensi menggunakan `npm install`.
- API saat ini belum menggunakan autentikasi/otorisasi pada routes yang dijelaskan di README ini. Gunakan untuk pembelajaran dan demonstrasi, bukan untuk menyimpan data kesehatan nyata atau dipublikasikan sebagai layanan produksi.
- Belum ada endpoint `available-slots` maupun pencarian booking berdasarkan kode dan nomor telepon pada routes saat ini. Jangan mengandalkan kedua fitur tersebut sampai benar-benar diimplementasikan.
- Script `npm test` pada `package.json` masih berupa placeholder, sehingga pengujian dilakukan manual melalui Postman/Thunder Client kecuali automated test ditambahkan kemudian.
- Pesan `GET /` saat ini dapat masih menampilkan beberapa endpoint template awal (`products` dan `test`) dan belum mencantumkan seluruh endpoint klinik. Route klinik tetap didaftarkan di `server.js`; gunakan daftar endpoint dalam README ini untuk pengujian.

---

README ini menjelaskan cara menjalankan backend lokal dan endpoint yang ditemukan pada source backend yang menjadi dasar dokumen. Perbarui panduan jika struktur route, format request, atau aturan bisnis berubah.
