import { useEffect, useRef, useState, type FormEvent } from 'react'
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

type BookingField =
  | 'patientName'
  | 'patientPhone'
  | 'patientBirthDate'
  | 'selectedDoctor'
  | 'appointmentDate'
  | 'selectedTime'

type BookingFieldErrors = Partial<Record<BookingField, string>>

const getJakartaDate = (): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`
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

function BookingPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [doctorSchedules, setDoctorSchedules] = useState<DoctorSchedule[]>([])
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false)
  const [scheduleError, setScheduleError] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState('')
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [slotError, setSlotError] = useState('')
  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [patientBirthDate, setPatientBirthDate] = useState('')
  const [patientGender, setPatientGender] = useState('')
  const [patientComplaint, setPatientComplaint] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<BookingFieldErrors>({})
  const shouldScrollToFirstError = useRef(false)
  const navigate = useNavigate()
  const today = getJakartaDate()

  const selectedDate = appointmentDate
    ? new Date(`${appointmentDate}T00:00:00Z`)
    : null

  const selectedDayOfWeek = selectedDate
    ? selectedDate.getUTCDay() === 0
      ? 7
      : selectedDate.getUTCDay()
    : null

  const selectedDayName = selectedDate
    ? selectedDate.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
      })
    : ''

  const formattedAppointmentDate = selectedDate
    ? selectedDate.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  const isPracticeDay =
    selectedDayOfWeek !== null &&
    doctorSchedules.some(
      (schedule) => Number(schedule.day_of_week) === selectedDayOfWeek
    )

  const availablePracticeDays = [
    ...new Set(
      doctorSchedules
        .map((schedule) => practiceDayNames[schedule.day_of_week - 1])
        .filter(Boolean)
    ),
  ].join(', ')

  useEffect(() => {
    if (!shouldScrollToFirstError.current) {
      return
    }

    const firstInvalidField =
      document.querySelector<HTMLElement>(
        '.booking-form [aria-invalid="true"]'
      )

    if (firstInvalidField) {
      firstInvalidField.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })

      if (!firstInvalidField.hasAttribute('disabled')) {
        firstInvalidField.focus({ preventScroll: true })
      }
    }

    shouldScrollToFirstError.current = false
  }, [fieldErrors])

  useEffect(() => {
    let isCancelled = false

    const fetchDoctors = async () => {
      try {
        const response = await api.get('/doctors')
        const doctorData: Doctor[] = response.data.data ?? []

        if (!isCancelled) {
          setDoctors(
            doctorData.filter((doctor) => Number(doctor.is_active) === 1)
          )
        }
      } catch {
        if (!isCancelled) {
          setError(
            'Daftar dokter belum dapat dimuat. Silakan muat ulang halaman.'
          )
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchDoctors()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedDoctor) {
      setDoctorSchedules([])
      setScheduleError('')
      setIsLoadingSchedules(false)
      return
    }

    let isCancelled = false

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

        if (!isCancelled) {
          const scheduleData: DoctorSchedule[] = response.data.data ?? []
          setDoctorSchedules(scheduleData)
        }
      } catch {
        if (!isCancelled) {
          setScheduleError('Jadwal praktik dokter belum dapat dimuat.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSchedules(false)
        }
      }
    }

    fetchDoctorSchedules()

    return () => {
      isCancelled = true
    }
  }, [selectedDoctor])

  useEffect(() => {
    if (
      !selectedDoctor ||
      !appointmentDate ||
      isLoadingSchedules ||
      scheduleError ||
      doctorSchedules.length === 0 ||
      !isPracticeDay
    ) {
      setAvailableSlots([])
      setSelectedTime('')
      setSlotError('')
      setIsLoadingSlots(false)
      return
    }

    let isCancelled = false

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

        if (!isCancelled) {
          const slotData: string[] = response.data.data ?? []
          setAvailableSlots(slotData)
        }
      } catch {
        if (!isCancelled) {
          setSlotError(
            'Slot waktu belum dapat dimuat. Silakan coba kembali.'
          )
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSlots(false)
        }
      }
    }

    fetchAvailableSlots()

    return () => {
      isCancelled = true
    }
  }, [
    selectedDoctor,
    appointmentDate,
    isLoadingSchedules,
    scheduleError,
    doctorSchedules,
    isPracticeDay,
  ])

  const clearFieldError = (field: BookingField) => {
    setFieldErrors((currentErrors) => {
      const updatedErrors = { ...currentErrors }
      delete updatedErrors[field]
      return updatedErrors
    })

    setSubmitError('')
  }

  const validateBookingForm = (): boolean => {
    const errors: BookingFieldErrors = {}
    const normalizedPhone = patientPhone.trim().replace(/[\s-]/g, '')

    if (!patientName.trim()) {
      errors.patientName = 'Nama lengkap wajib diisi.'
    } else if (patientName.trim().length < 3) {
      errors.patientName = 'Nama lengkap minimal 3 karakter.'
    }

    if (!normalizedPhone) {
      errors.patientPhone = 'Nomor telepon wajib diisi.'
    } else if (!/^\+?\d{8,20}$/.test(normalizedPhone)) {
      errors.patientPhone =
        'Nomor telepon harus terdiri dari 8–20 digit dan boleh diawali +.'
    }

    if (!patientBirthDate) {
      errors.patientBirthDate = 'Tanggal lahir wajib diisi.'
    } else if (patientBirthDate > today) {
      errors.patientBirthDate =
        'Tanggal lahir tidak boleh melewati hari ini.'
    }

    if (isLoading) {
      errors.selectedDoctor =
        'Daftar dokter sedang dimuat. Silakan tunggu.'
    } else if (error) {
      errors.selectedDoctor =
        'Daftar dokter gagal dimuat. Silakan muat ulang halaman.'
    } else if (doctors.length === 0) {
      errors.selectedDoctor = 'Belum ada dokter aktif yang tersedia.'
    } else if (!selectedDoctor) {
      errors.selectedDoctor = 'Silakan pilih dokter terlebih dahulu.'
    } else if (
      !doctors.some((doctor) => String(doctor.id) === selectedDoctor)
    ) {
      errors.selectedDoctor =
        'Pilihan dokter tidak valid. Silakan pilih kembali.'
    }

    if (!selectedDoctor) {
      errors.appointmentDate =
        'Pilih dokter terlebih dahulu sebelum menentukan tanggal kunjungan.'
    } else if (isLoadingSchedules) {
      errors.appointmentDate =
        'Jadwal praktik dokter sedang dimuat. Silakan tunggu.'
    } else if (scheduleError) {
      errors.appointmentDate =
        'Jadwal praktik dokter gagal dimuat. Silakan pilih ulang dokter.'
    } else if (doctorSchedules.length === 0) {
      errors.appointmentDate =
        'Dokter belum memiliki jadwal praktik aktif.'
    } else if (!appointmentDate) {
      errors.appointmentDate = 'Tanggal kunjungan wajib dipilih.'
    } else if (appointmentDate < today) {
      errors.appointmentDate =
        'Tanggal kunjungan tidak boleh sudah lewat.'
    } else if (!isPracticeDay) {
      errors.appointmentDate =
        'Dokter tidak praktik pada tanggal yang dipilih.'
    }

    if (
      selectedDoctor &&
      appointmentDate &&
      !isLoadingSchedules &&
      !scheduleError &&
      doctorSchedules.length > 0 &&
      isPracticeDay
    ) {
      if (isLoadingSlots) {
        errors.selectedTime =
          'Slot waktu sedang dimuat. Silakan tunggu.'
      } else if (slotError) {
        errors.selectedTime =
          'Slot waktu gagal dimuat. Silakan pilih ulang tanggal atau dokter.'
      } else if (availableSlots.length === 0) {
        errors.selectedTime =
          'Tidak ada slot waktu tersedia pada tanggal ini. Silakan pilih tanggal lain.'
      } else if (!selectedTime) {
        errors.selectedTime = 'Silakan pilih waktu kunjungan.'
      } else if (!availableSlots.includes(selectedTime)) {
        errors.selectedTime =
          'Slot waktu tidak tersedia. Silakan pilih waktu lain.'
      }
    }

    setFieldErrors(errors)

    return Object.keys(errors).length === 0
  }

  const handleBookingSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setSubmitError('')

    if (isSubmitting) {
      return
    }

    if (!validateBookingForm()) {
      shouldScrollToFirstError.current = true
      return
    }

    setIsSubmitting(true)

    try {
      const normalizedPhone = patientPhone.trim().replace(/[\s-]/g, '')
      const patientResponse = await api.post('/patients', {
        full_name: patientName.trim(),
        phone: normalizedPhone,
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
    } catch (requestError) {
      if (isAxiosError(requestError)) {
        const apiError = requestError.response?.data?.error
        const apiMessage = requestError.response?.data?.message
        const message =
          (typeof apiError === 'string' && apiError) ||
          (typeof apiMessage === 'string' && apiMessage) ||
          (!requestError.response
            ? 'Tidak dapat terhubung ke server. Periksa koneksi backend.'
            : 'Pemesanan gagal. Silakan periksa data dan coba kembali.')

        setSubmitError(message)
      } else {
        setSubmitError('Terjadi kesalahan. Silakan coba kembali.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

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
        <form className="booking-form" onSubmit={handleBookingSubmit} noValidate>
          <h2>Data Pasien</h2>
          <div className="form-group">
            <label htmlFor="patient-name">Nama Lengkap *</label>
            <input
              id="patient-name"
              type="text"
              placeholder="Masukkan nama lengkap"
              value={patientName}
              autoComplete="name"
              aria-invalid={Boolean(fieldErrors.patientName)}
              aria-describedby={
                fieldErrors.patientName ? 'patient-name-error' : undefined
              }
              onChange={(event) => {
                setPatientName(event.target.value)
                clearFieldError('patientName')
              }}
              required
            />

            {fieldErrors.patientName && (
              <p
                id="patient-name-error"
                className="form-error"
                role="alert"
              >
                {fieldErrors.patientName}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="patient-phone">Nomor Telepon *</label>
            <input
              id="patient-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Contoh: 081234567890"
              value={patientPhone}
              aria-invalid={Boolean(fieldErrors.patientPhone)}
              aria-describedby={
                fieldErrors.patientPhone ? 'patient-phone-error' : undefined
              }
              onChange={(event) => {
                setPatientPhone(event.target.value)
                clearFieldError('patientPhone')
              }}
              required
              minLength={8}
              maxLength={20}
            />

            {fieldErrors.patientPhone && (
              <p
                id="patient-phone-error"
                className="form-error"
                role="alert"
              >
                {fieldErrors.patientPhone}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="patient-birth">Tanggal Lahir *</label>
            <input
              id="patient-birth"
              type="date"
              max={today}
              value={patientBirthDate}
              aria-invalid={Boolean(fieldErrors.patientBirthDate)}
              aria-describedby={
                fieldErrors.patientBirthDate
                  ? 'patient-birth-date-error'
                  : undefined
              }
              onChange={(event) => {
                setPatientBirthDate(event.target.value)
                clearFieldError('patientBirthDate')
              }}
              required
            />

            {fieldErrors.patientBirthDate && (
              <p
                id="patient-birth-date-error"
                className="form-error"
                role="alert"
              >
                {fieldErrors.patientBirthDate}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="patient-gender">
              Jenis Kelamin (Opsional)
            </label>
            <select
              id="patient-gender"
              value={patientGender}
              onChange={(event) => setPatientGender(event.target.value)}
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
              onChange={(event) => setPatientComplaint(event.target.value)}
            />
          </div>

          <h2>Jadwal Kunjungan</h2>

          <div className="form-group">
            <label htmlFor="doctor">Pilih Dokter *</label>

            {isLoading && (
              <p className="booking-hint" role="status">
                Memuat daftar dokter...
              </p>
            )}

            {!isLoading && error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            {!isLoading && !error && doctors.length === 0 && (
              <p className="booking-hint" role="status">
                Belum ada dokter aktif yang tersedia.
              </p>
            )}

            <select
              id="doctor"
              value={selectedDoctor}
              onChange={(event) => {
                setSelectedDoctor(event.target.value)
                setDoctorSchedules([])
                setAppointmentDate('')
                setSelectedTime('')
                setAvailableSlots([])

                clearFieldError('selectedDoctor')
                clearFieldError('appointmentDate')
                clearFieldError('selectedTime')
              }}
              aria-invalid={Boolean(fieldErrors.selectedDoctor)}
              aria-describedby={
                fieldErrors.selectedDoctor ? 'doctor-error' : undefined
              }
              required
              disabled={isLoading || Boolean(error) || doctors.length === 0}
            >
              <option value="">Pilih Dokter</option>

              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.title_prefix ? `${doctor.title_prefix} ` : ''}
                  {doctor.full_name}
                  {doctor.title_suffix ? ` ${doctor.title_suffix}` : ''}
                  {' - '}
                  {doctor.specialization}
                </option>
              ))}
            </select>

            {fieldErrors.selectedDoctor && (
              <p id="doctor-error" className="form-error" role="alert">
                {fieldErrors.selectedDoctor}
              </p>
            )}
          </div>

          {selectedDoctor && (
            <div className="doctor-schedule-info">
              <strong>Jadwal Praktik Dokter</strong>

              {isLoadingSchedules && (
                <p className="booking-hint" role="status">
                  Memuat jadwal praktik...
                </p>
              )}

              {!isLoadingSchedules && scheduleError && (
                <p className="form-error" role="alert">
                  {scheduleError}
                </p>
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
                      <div
                        key={schedule.id}
                        className="doctor-schedule-item"
                      >
                        <span>
                          {practiceDayNames[schedule.day_of_week - 1]}
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
            <label htmlFor="appointment-date">Tanggal Kunjungan *</label>

            <input
              id="appointment-date"
              type="date"
              value={appointmentDate}
              min={today}
              onChange={(event) => {
                setAppointmentDate(event.target.value)
                setSelectedTime('')
                setAvailableSlots([])

                clearFieldError('appointmentDate')
                clearFieldError('selectedTime')
              }}
              aria-invalid={Boolean(fieldErrors.appointmentDate)}
              aria-describedby={
                fieldErrors.appointmentDate
                  ? 'appointment-date-error'
                  : undefined
              }
              required
              disabled={
                !selectedDoctor ||
                isLoadingSchedules ||
                Boolean(scheduleError) ||
                doctorSchedules.length === 0
              }
            />

            {fieldErrors.appointmentDate && (
              <p
                id="appointment-date-error"
                className="form-error"
                role="alert"
              >
                {fieldErrors.appointmentDate}
              </p>
            )}

            {selectedDate && (
              <p className="booking-date-info">
                Tanggal dipilih: {formattedAppointmentDate}
              </p>
            )}

            {selectedDate &&
              selectedDoctor &&
              !isLoadingSchedules &&
              !scheduleError &&
              doctorSchedules.length > 0 && (
                <p className="booking-hint">
                  Hari praktik dokter: {availablePracticeDays}
                </p>
              )}

            {selectedDate &&
              selectedDoctor &&
              !isLoadingSchedules &&
              !scheduleError &&
              doctorSchedules.length > 0 &&
              !isPracticeDay && (
                <p className="booking-warning" role="status">
                  Dokter tidak praktik pada hari {selectedDayName}. Silakan
                  pilih salah satu hari praktik: {availablePracticeDays}.
                </p>
              )}
          </div>

          <div className="form-group">
            <label htmlFor="appointment-time">Waktu Kunjungan *</label>

            <select
              id="appointment-time"
              value={selectedTime}
              onChange={(event) => {
                setSelectedTime(event.target.value)
                clearFieldError('selectedTime')
              }}
              aria-invalid={Boolean(fieldErrors.selectedTime)}
              aria-describedby={
                fieldErrors.selectedTime
                  ? 'appointment-time-error'
                  : undefined
              }
              required
              disabled={
                !selectedDoctor ||
                !appointmentDate ||
                isLoadingSchedules ||
                Boolean(scheduleError) ||
                !isPracticeDay ||
                isLoadingSlots ||
                availableSlots.length === 0
              }
            >
              <option value="">
                {!selectedDoctor || !appointmentDate
                  ? 'Pilih dokter dan tanggal terlebih dahulu'
                  : isLoadingSchedules
                    ? 'Memuat jadwal praktik dokter...'
                    : scheduleError
                      ? 'Jadwal praktik tidak dapat dimuat'
                      : !isPracticeDay
                        ? 'Dokter tidak praktik pada hari ini'
                        : isLoadingSlots
                          ? 'Memuat slot waktu...'
                          : slotError
                            ? 'Slot waktu tidak dapat dimuat'
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

            {fieldErrors.selectedTime && (
              <p
                id="appointment-time-error"
                className="form-error"
                role="alert"
              >
                {fieldErrors.selectedTime}
              </p>
            )}

            {selectedDoctor &&
              appointmentDate &&
              isPracticeDay &&
              !isLoadingSlots &&
              !slotError &&
              !fieldErrors.selectedTime &&
              availableSlots.length === 0 && (
                <p className="booking-warning" role="status">
                  Belum ada slot waktu yang tersedia pada tanggal ini.
                  Silakan pilih tanggal lain.
                </p>
              )}

            {slotError && !fieldErrors.selectedTime && (
              <p className="form-error" role="alert">
                {slotError}
              </p>
            )}
          </div>

          <p className="booking-note">
            Data yang Anda isi akan digunakan untuk keperluan pendaftaran pasien
            dan pemesanan appointment.
          </p>

          {submitError && (
            <p className="booking-error" role="alert">
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