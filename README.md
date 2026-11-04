# Mediverse – Sistem Appointment Klinik Berbasis Web

**Proyek Ujian Tengah Semester (UTS)**  
Mata Kuliah: **Pengembangan Aplikasi Berbasis Platform**

> **Disclaimer:** Mediverse merupakan proyek akademik untuk keperluan pembelajaran dan demonstrasi. Aplikasi ini bukan sistem layanan kesehatan resmi dan tidak digunakan untuk diagnosis atau pengambilan keputusan medis. Gunakan data dummy saat pengujian dan hindari memasukkan data pasien yang sebenarnya.

## Anggota Kelompok

| Nama | NIM |
|---|---|
| EDRIC KANG | 231120060 |
| ANGEL JAUHARI | 231120080 |
| WENNIE | 231120216 |
| ENDELYN WIJAYA | 231120993 |
| JENNIFER | 231120457 |

## Gambaran Proyek

**Mediverse** adalah aplikasi berbasis web untuk membantu proses pembuatan dan pengelolaan janji temu klinik. Pengguna dapat melihat informasi dokter, memilih jadwal praktik yang tersedia, melakukan booking, serta mencari dan melihat detail appointment menggunakan kode booking.

Aplikasi ini dikembangkan sebagai proyek UTS dengan pemisahan frontend dan backend serta menggunakan SQLite sebagai basis data.

## Fitur Utama

- Melihat daftar dokter, spesialisasi, dan informasi praktik.
- Melihat jadwal serta slot appointment yang tersedia.
- Mengisi data pasien dan membuat janji temu.
- Mendapatkan kode booking setelah appointment berhasil dibuat.
- Mencari appointment menggunakan kode booking.
- Melihat daftar appointment beserta ringkasan dan detailnya.
- Melihat status dan membatalkan appointment sesuai ketentuan aplikasi.

## Teknologi yang Digunakan

- **Frontend:** React, TypeScript, Vite, React Router, dan Axios.
- **Backend:** Node.js dan Express.
- **Database:** SQLite.
- **Tools:** npm dan Postman (untuk pengujian API).

## Persyaratan Minimum

- Node.js **20.19+** atau **22.12+**.
- npm (disertakan bersama instalasi Node.js).
- Browser modern seperti Google Chrome atau Microsoft Edge.

Persyaratan Node.js mengikuti kebutuhan Vite 8. Lihat [dokumentasi resmi Vite](https://vite.dev/guide/).

## Konfigurasi Environment

### Backend

Di folder `backend`, salin `.env.example` menjadi `.env`:

```env
PORT=3000
```

### Frontend

Buat file `.env` di dalam folder `frontend`:

```env
VITE_API_URL=http://localhost:3000/api
```

File `.env` berisi konfigurasi lokal dan tidak perlu diunggah ke repository. Jangan menyimpan password, token, atau informasi rahasia di dalam repository.

## Cara Menjalankan Aplikasi

Jalankan backend dan frontend pada **dua terminal CMD terpisah**.

**1. Backend**

```bash
cd backend
npm ci
copy .env.example .env
npm run dev
```

**2. Frontend**

```bash
cd frontend
npm ci
npm run dev
```

Pastikan file `frontend/.env` sudah dibuat sebelum menjalankan frontend. Setelah Vite berjalan, buka alamat lokal yang ditampilkan pada terminal (umumnya `http://localhost:5173`). Backend berjalan pada `http://localhost:3000`.

Database SQLite diinisialisasi oleh backend saat server pertama kali dijalankan.

## Struktur Proyek

```text
rumahsakit/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── sql_scripts/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
└── README.md
```

---

Dikembangkan untuk memenuhi tugas Ujian Tengah Semester mata kuliah **Pengembangan Aplikasi Berbasis Platform**.
