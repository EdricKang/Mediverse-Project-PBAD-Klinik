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

interface DoctorSchedule {
  id: number
  doctor_id: number
  day_of_week: number
  start_time: string
  end_time: string
  is_active: number | boolean
}

function BookingPage() {
  
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState('')
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [slotError, setSlotError] = useState('')
  const [doctorSchedules, setDoctorSchedules] = useState<DoctorSchedule[]>([])
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false)
  const [scheduleError, setScheduleError] = useState('')

  const selectedDate = appointmentDate
  ? new Date(`${appointmentDate}T00:00:00`)
  : null

  const selectedDayOfWeek = selectedDate
    ? selectedDate.getDay() === 0
      ? 7
      : selectedDate.getDay()
    : null

  const selectedDayName = selectedDate
    ? selectedDate.toLocaleDateString('id-ID', {
        weekday: 'long',
      })
    : ''

  const formattedAppointmentDate = selectedDate
    ? selectedDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  const isPracticeDay =
    selectedDayOfWeek !== null &&
    doctorSchedules.some(
      (schedule) =>
        Number(schedule.day_of_week) === selectedDayOfWeek
    )

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

  useEffect(() => {
    if (!selectedDoctor) {
      setDoctorSchedules([])
      setScheduleError('')
      return
    }

    const fetchDoctorSchedules = async () => {
      setIsLoadingSchedules(true)
      setScheduleError('')
      setDoctorSchedules([])

      try {
        const response = await api.get('/doctor-schedules', {
          params: {
            doctor_id: selectedDoctor,
            is_active: 1,
          },
        })

        const scheduleData: DoctorSchedule[] = response.data.data ?? []

        setDoctorSchedules(scheduleData)
      } catch {
        setScheduleError('Jadwal praktik dokter belum dapat dimuat.')
      } finally {
        setIsLoadingSchedules(false)
      }
    }

    fetchDoctorSchedules()
  }, [selectedDoctor])

  useEffect(() => {
    if (!selectedDoctor || !appointmentDate) {
      setAvailableSlots([])
      setSelectedTime('')
      setSlotError('')
      return
    }

    const fetchAvailableSlots = async () => {
      setIsLoadingSlots(true)
      setSlotError('')
      setSelectedTime('')
      setAvailableSlots([])

      try {
        const response = await api.get('/appointments/available-slots', {
          params: {
            doctor_id: selectedDoctor,
            date: appointmentDate,
          },
        })

        const slotData: string[] = response.data.data ?? []

        setAvailableSlots(slotData)
      } catch {
        setSlotError('Jadwal praktik belum dapat dimuat. Silakan coba kembali.')
      } finally {
        setIsLoadingSlots(false)
      }
    }

    fetchAvailableSlots()
  }, [selectedDoctor, appointmentDate])

  const practiceDayNames = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
    'Minggu',
  ]

  const availablePracticeDays = doctorSchedules
    .map((schedule) => practiceDayNames[schedule.day_of_week - 1])
    .filter(Boolean)
    .join(', ')

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
            <label htmlFor="patient-name">Nama Lengkap *</label>
            <input
              type="text"
              id="patient-name"
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="patient-phone">Nomor Telepon *</label>
            <input
              type="tel"
              id="patient-phone"
              placeholder="Masukkan nomor telepon"
              minLength={8}
              maxLength={20}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="patient-birth">Tanggal Lahir *</label>
            <input
              type="date"
              id="patient-birth"
              max={new Date().toLocaleDateString('en-CA')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="patient-gender">
              Jenis Kelamin (Opsional)
            </label>
            <select id="patient-gender" defaultValue="">
              <option value="">Tidak ingin memilih</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="patient-complaint">
              Keluhan (Opsional)
            </label>
            <textarea
              id="patient-complaint"
              rows={3}
              placeholder="Tuliskan keluhan yang ingin dikonsultasikan"
            />
          </div>

          <h2>Jadwal Kunjungan</h2>

          <div className="form-group">
            <label htmlFor="doctor">Pilih Dokter</label>
              <select
                id="doctor"
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
              >
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

          {selectedDoctor && (
            <div className="doctor-schedule-info">
              <strong>Jadwal Praktik Dokter</strong>

              {isLoadingSchedules && (
                <p>Memuat jadwal praktik...</p>
              )}

              {!isLoadingSchedules && scheduleError && (
                <p className="error-message">{scheduleError}</p>
              )}

              {!isLoadingSchedules &&
                !scheduleError &&
                doctorSchedules.length === 0 && (
                  <p>Belum ada jadwal praktik untuk dokter ini.</p>
              )}

              {!isLoadingSchedules &&
                !scheduleError &&
                doctorSchedules.length > 0 && (
                  <div className="doctor-schedule-list">
                    {doctorSchedules.map((schedule) => (
                      <div key={schedule.id} className="doctor-schedule-item">
                        <span>
                          {[
                            'Senin',
                            'Selasa',
                            'Rabu',
                            'Kamis',
                            'Jumat',
                            'Sabtu',
                            'Minggu',
                          ][schedule.day_of_week - 1]}
                        </span>

                        <strong>
                          {schedule.start_time} - {schedule.end_time}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
          </div>
          )}

            <div className="form-group">
              <label htmlFor="appointment-date">Tanggal Kunjungan</label>

              <input
                type="date"
                id="appointment-date"
                min={new Date().toLocaleDateString('en-CA')}
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                disabled={
                  !selectedDoctor ||
                  isLoadingSchedules ||
                  scheduleError !== '' ||
                  doctorSchedules.length === 0
                }
              />

              {appointmentDate && (
                <p className="booking-date-info">
                  Tanggal yang dipilih: <strong>{formattedAppointmentDate}</strong>
                </p>
              )}

              {appointmentDate &&
                !isLoadingSchedules &&
                !scheduleError &&
                doctorSchedules.length > 0 &&
                !isPracticeDay && (
                  <p className="booking-warning">
                    Dokter tidak praktik pada hari {selectedDayName}.
                    Hari praktik dokter: {availablePracticeDays}.
                  </p>
                )}
            </div>

          <div className="form-group">
            <label htmlFor="appointment-time">Waktu Kunjungan</label>
              <select
                id="appointment-time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                disabled={
                  !selectedDoctor ||
                  !appointmentDate ||
                  isLoadingSchedules ||
                  isLoadingSlots ||
                  availableSlots.length === 0
                }
              >
                <option value="" disabled>
                  {!selectedDoctor || !appointmentDate
                    ? 'Pilih dokter dan tanggal terlebih dahulu'
                    : isLoadingSchedules
                      ? 'Memuat jadwal praktik dokter...'
                      : isLoadingSlots
                        ? 'Memuat slot waktu...'
                      : slotError
                        ? 'Jadwal tidak dapat dimuat'
                      : !isPracticeDay
                        ? 'Dokter tidak praktik pada hari ini'
                        : availableSlots.length === 0
                          ? 'Tidak ada slot tersedia pada tanggal ini'
                          : 'Pilih waktu kunjungan'}
                </option>

                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>

              {appointmentDate &&
                isPracticeDay &&
                !isLoadingSlots &&
                !slotError &&
                availableSlots.length === 0 && (
                  <p className="booking-warning">
                    Belum ada slot waktu yang tersedia pada tanggal ini.
                    Silakan pilih tanggal lain.
                  </p>
                )}

              {slotError && (
                <p className="doctor-message error-message">
                  {slotError}
                </p>
              )}
          </div>

          <p className="booking-note">
            Data yang Anda isi akan digunakan untuk keperluan
            pendaftaran pasien dan pemesanan appointment.
          </p>

          <button type="button" disabled>
            Buat Janji Temu
          </button>
        </form>
      </div>
    </section>
  )
}

export default BookingPage