import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
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
  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [patientBirthDate, setPatientBirthDate] = useState('')
  const [patientGender, setPatientGender] = useState('')
  const [patientComplaint, setPatientComplaint] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const navigate = useNavigate()

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

  const handleBookingSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setSubmitError('')

    if (!selectedDoctor || !appointmentDate || !selectedTime) {
      setSubmitError('Silakan lengkapi pilihan dokter dan jadwal kunjungan.')
      return
    }

    if (!isPracticeDay) {
      setSubmitError('Dokter tidak praktik pada tanggal yang dipilih.')
      return
    }

    if (!availableSlots.includes(selectedTime)) {
      setSubmitError('Slot waktu tidak tersedia. Silakan pilih waktu lain.')
      return
    }

    setIsSubmitting(true)

    try {
      const patientResponse = await api.post('/patients', {
        full_name: patientName.trim(),
        phone: patientPhone.trim(),
        date_of_birth: patientBirthDate,
        gender: patientGender || null,
      })

      const patientId = patientResponse.data.data.id

      const appointmentResponse = await api.post('/appointments', {
        patient_id: patientId,
        doctor_id: Number(selectedDoctor),
        appointment_date: appointmentDate,
        appointment_time: selectedTime,
        complaint: patientComplaint.trim() || null,
      })

      navigate('/booking/success', {
        state: {
          appointment: appointmentResponse.data.data,
        },
      })
    } catch (error) {
      if (isAxiosError(error)) {
        const apiError = error.response?.data?.error

        const message =
          (typeof apiError === 'string' && apiError) ||
          error.response?.data?.message ||
          'Pemesanan gagal. Silakan coba kembali.'

        setSubmitError(message)
      } else {
        setSubmitError('Terjadi kesalahan. Silakan coba kembali.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

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

        <form className="booking-form" onSubmit={handleBookingSubmit}>
          <h2>Data Pasien</h2>

          <div className="form-group">
            <label htmlFor="patient-name">Nama Lengkap *</label>
            <input
              type="text"
              id="patient-name"
              placeholder="Masukkan nama lengkap"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
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
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="patient-birth">Tanggal Lahir *</label>
            <input
              type="date"
              id="patient-birth"
              max={new Date().toLocaleDateString('en-CA')}
              value={patientBirthDate}
              onChange={(e) => setPatientBirthDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="patient-gender">
              Jenis Kelamin (Opsional)
            </label>
            <select
              id="patient-gender"
              value={patientGender}
              onChange={(e) => setPatientGender(e.target.value)}
            >
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
              value={patientComplaint}
              onChange={(e) => setPatientComplaint(e.target.value)}
            />
          </div>

          <h2>Jadwal Kunjungan</h2>

          <div className="form-group">
            <label htmlFor="doctor">Pilih Dokter</label>
              <select
                id="doctor"
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                required
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
                required
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
                required
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

          {submitError && (
            <p className="booking-warning">
              {submitError}
            </p>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Memproses...' : 'Buat Janji Temu'}
          </button>

        </form>
      </div>
    </section>
  )
}

export default BookingPage