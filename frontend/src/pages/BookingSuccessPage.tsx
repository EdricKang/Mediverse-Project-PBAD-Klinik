import { Link, useLocation } from 'react-router-dom'

interface Appointment {
  id: number
  patient_id: number
  doctor_id: number
  booking_code: string
  appointment_date: string
  appointment_time: string
  complaint: string | null
  status: string
  patient_name: string
  patient_phone: string
  title_prefix: string | null
  doctor_name: string
  title_suffix: string | null
  doctor_specialization: string
  room_number: string
}

interface BookingSuccessState {
  appointment?: Appointment
}

function BookingSuccessPage() {
  const location = useLocation()
  const state = location.state as BookingSuccessState | null
  const appointment = state?.appointment

  if (!appointment) {
    return (
      <section className="booking-success-page">
        <div className="container">
          <div className="booking-success-card">
            <h1>Data Booking Tidak Ditemukan</h1>
            <p>
              Silakan lakukan pemesanan janji temu terlebih dahulu.
            </p>
            <Link to="/booking" className="success-primary-button">
              Buat Janji Temu
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const doctorName = [
    appointment.title_prefix,
    appointment.doctor_name,
    appointment.title_suffix,
  ]
    .filter(Boolean)
    .join(' ')

  const formattedDate = new Date(
    `${appointment.appointment_date}T00:00:00`
  ).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const formattedTime = appointment.appointment_time.slice(0, 5)

  const statusLabels: Record<string, string> = {
    pending: 'Menunggu Konfirmasi',
    confirmed: 'Dikonfirmasi',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  }

  const statusLabel =
    statusLabels[appointment.status] || appointment.status

  return (
    <section className="booking-success-page">
      <div className="container">
        <div className="booking-success-card">
          <div className="success-icon">✓</div>

          <h1>Pemesanan Berhasil!</h1>

          <p className="success-description">
            Janji temu kamu berhasil dibuat.
            Silakan simpan kode booking berikut untuk keperluan
            pengecekan appointment.
          </p>

          <div className="booking-code-box">
            <span>KODE BOOKING</span>
            <strong>{appointment.booking_code}</strong>
          </div>

          <div className="success-details">
            <h2>Detail Janji Temu</h2>

            <div className="success-detail-item">
              <span>Nama Pasien</span>
              <strong>{appointment.patient_name}</strong>
            </div>

            <div className="success-detail-item">
              <span>Nomor Telepon</span>
              <strong>{appointment.patient_phone}</strong>
            </div>

            <div className="success-detail-item">
              <span>Dokter</span>
              <strong>{doctorName}</strong>
            </div>

            <div className="success-detail-item">
              <span>Spesialisasi</span>
              <strong>{appointment.doctor_specialization}</strong>
            </div>

            <div className="success-detail-item">
              <span>Tanggal Kunjungan</span>
              <strong>{formattedDate}</strong>
            </div>

            <div className="success-detail-item">
              <span>Waktu Kunjungan</span>
              <strong>{formattedTime} WIB</strong>
            </div>

            <div className="success-detail-item">
              <span>Nomor Ruangan</span>
              <strong>{appointment.room_number}</strong>
            </div>

            <div className="success-detail-item">
              <span>Status</span>
              <strong className={`success-status success-status--${appointment.status}`}>
                {statusLabel}
              </strong>
            </div>
          </div>

          <p className="success-note">
            Harap datang sesuai jadwal yang telah dipilih.
            Tunjukkan kode booking saat melakukan kunjungan.
          </p>

          <Link to="/" className="success-primary-button">
            Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    </section>
  )
}

export default BookingSuccessPage