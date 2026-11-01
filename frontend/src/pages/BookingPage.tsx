import { useEffect, useState } from 'react'
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


function BookingPage() {
  
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await api.get('/doctors')
        const doctorData: Doctor[] = response.data.data ?? []

        setDoctors(
          doctorData.filter((doctor) => Number(doctor.is_active) === 1)
        )
      } catch {
        setError('Daftar dokter belum dapat dimuat.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDoctors()
  }, [])

  return (
    <section className="booking-page">
      <div className="container">
        <div className="booking-heading">
          <span>PEMESANAN APPOINTMENT</span>
          <h1>Buat Janji Temu</h1>
          <p>
            Silakan isi data berikut untuk membuat janji temu
            dengan dokter.
          </p>
        </div>

        <form className="booking-form">
          <h2>Data Pasien</h2>

          <div className="form-group">
            <label htmlFor="patient-name">Nama Lengkap</label>
            <input type="text" id="patient-name" placeholder="Masukkan nama lengkap"
            />
          </div>

          <div className="form-group">
            <label htmlFor="patient-phone">Nomor Telepon</label>
            <input type="tel" id="patient-phone" placeholder="Masukkan nomor telepon"/>
          </div>

          <h2>Jadwal Kunjungan</h2>

          <div className="form-group">
            <label htmlFor="doctor">Pilih Dokter</label>
            <select id="doctor" defaultValue="">
              <option value="" disabled>
                Pilih dokter
              </option>
              
              {isLoading && (
                <option value="" disabled>
                  Memuat daftar dokter...
                </option>
              )}

              {!isLoading && error && (
                <option value="" disabled>
                  {error}
                </option>
              )}

              {!isLoading && !error && doctors.length === 0 && (
                <option value="" disabled>
                  Belum ada dokter aktif.
                </option>
              )}

              {!isLoading && !error && doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {[doctor.title_prefix, doctor.full_name, doctor.title_suffix]
                    .filter(Boolean)
                    .join(' ')} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="appointment-date">Tanggal Kunjungan</label>
            <input type="date" id="appointment-date" />
          </div>

          <div className="form-group">
            <label htmlFor="appointment-time">Waktu Kunjungan</label>
            <select id="appointment-time" defaultValue="" disabled>
              <option value="" disabled>
                Pilih dokter dan tanggal terlebih dahulu
              </option>
            </select>
          </div>

          <button type="button" disabled>
            Buat Janji Temu
          </button>
        </form>
      </div>
    </section>
  )
}

export default BookingPage