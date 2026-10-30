import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

interface Doctor {
  id: number
  title_prefix: string | null
  full_name: string
  title_suffix: string | null
  specialization: string
  room_number: string | null
  is_active: number | boolean
}

function HomePage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await api.get('/doctors')
        const doctorData: Doctor[] = response.data.data ?? []

        setDoctors(
          doctorData.filter(
            (doctor) => doctor.is_active === true || Number(doctor.is_active) === 1
          )
        )
      } catch {
        setError('Daftar dokter belum dapat dimuat. Silakan coba kembali.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDoctors()
  }, [])

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="hero-badge">
              LAYANAN APPOINTMENT KLINIK
            </span>

            <h1>
              Kesehatan Anda,
              <span> Prioritas Kami.</span>
            </h1>

            <p>
              Atur jadwal konsultasi dengan dokter pilihan
              secara mudah dan praktis. Pilih waktu kunjungan
              Anda tanpa perlu proses yang rumit.
            </p>

            <div className="hero-actions">
              <Link to="/booking" className="primary-button">
                Buat Janji Temu
                <span>→</span>
              </Link>

              <Link to="/booking/lookup" className="secondary-button">
                Cari Booking
              </Link>
            </div>

            <div className="hero-note">
              <span>✓</span>
              Jadwalkan kunjungan dengan lebih mudah dan teratur.
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-decoration"></div>

            <div className="appointment-card">
              <div className="card-top">
                <div>
                  <span className="small-label">MEDIVERSE</span>
                  <h3>Appointment Klinik</h3>
                </div>

                <div className="medical-icon">✚</div>
              </div>

              <div className="card-divider"></div>

              <div className="card-message">
                <div className="calendar-icon">▦</div>
                <div>
                  <strong>Jadwalkan Kunjungan Anda</strong>
                  <p>Pilih dokter dan waktu yang sesuai.</p>
                </div>
              </div>

              <div className="card-status">
                <span className="status-dot"></span>
                Proses pemesanan mudah dan praktis
              </div>
            </div>

            <div className="floating-card">
              <span className="floating-icon">✓</span>
              <div>
                <strong>Lebih Praktis</strong>
                <p>Atur jadwal dari mana saja</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="section-heading">
            <span className="section-label">KENAPA MEDIVERSE?</span>
            <h2>Kemudahan dalam setiap kunjungan</h2>
            <p>
              Nikmati proses pengaturan jadwal konsultasi
              yang lebih sederhana.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">01</div>
              <h3>Pemesanan Mudah</h3>
              <p>
                Buat janji temu dengan mengisi data dan
                memilih dokter yang tersedia.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">02</div>
              <h3>Pilihan Jadwal</h3>
              <p>
                Lihat slot waktu yang tersedia dan tentukan
                jadwal kunjungan sesuai kebutuhan.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">03</div>
              <h3>Kode Booking</h3>
              <p>
                Dapatkan kode booking untuk memeriksa
                informasi dan status appointment.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="daftar-dokter" className="doctors-section">
        <div className="container">
          <div className="section-heading">
            <span className="section-label">TIM MEDIS KAMI</span>
            <h2>Temukan Dokter Anda</h2>
            <p>
              Pilih dokter sesuai kebutuhan konsultasi Anda.
            </p>
          </div>

          {isLoading && (
            <p className="doctor-message">Memuat daftar dokter...</p>
          )}

          {!isLoading && error && (
            <p className="doctor-message error-message">{error}</p>
          )}

          {!isLoading && !error && doctors.length === 0 && (
            <p className="doctor-message">
              Belum ada dokter aktif yang tersedia.
            </p>
          )}

          {!isLoading && !error && doctors.length > 0 && (
            <div className="doctors-grid">
              {doctors.map((doctor) => (
                <article className="doctor-card" key={doctor.id}>
                  <div className="doctor-avatar">
                    {doctor.full_name
                      .split(' ')
                      .slice(0, 2)
                      .map((part) => part.charAt(0))
                      .join('')
                      .toUpperCase()}
                  </div>

                  <div className="doctor-info">
                    <h3>
                      {[doctor.title_prefix, doctor.full_name, doctor.title_suffix]
                        .filter(Boolean)
                        .join(' ')}
                    </h3>

                    <p>{doctor.specialization}</p>
                  </div>

                  <div className="doctor-room">
                    <span>Ruang Praktik</span>
                    <strong>{doctor.room_number || 'Belum ditentukan'}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-content">
          <Link to="/" className="brand">
            <span className="brand-icon">M</span>
            <span>Mediverse</span>
          </Link>

          <p>Platform pemesanan janji temu klinik.</p>

          <span>© 2026 Mediverse. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}

export default HomePage