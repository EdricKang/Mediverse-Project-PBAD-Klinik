import { useEffect, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import api from '../services/api'

interface Appointment {
  id: number
  booking_code: string
  appointment_date: string
  appointment_time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  patient_name: string
  patient_phone: string
  title_prefix: string | null
  doctor_name: string
  title_suffix: string | null
  doctor_specialization: string
  room_number: string | null
}

interface AppointmentListItem {
  booking_code: string
  appointment_date: string
  appointment_time: string
  complaint: string | null
  status: Appointment['status']
  created_at: string
  updated_at: string
  patient_name: string
  patient_phone: string
  title_prefix: string | null
  doctor_name: string
  title_suffix: string | null
  doctor_specialization: string
  room_number: string | null
}

const statusLabels: Record<Appointment['status'], string> = {
  pending: 'Menunggu Konfirmasi',
  confirmed: 'Dikonfirmasi',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

const formatAppointmentDate = (dateValue: string) => {
  return new Date(`${dateValue}T00:00:00Z`).toLocaleDateString(
    'id-ID',
    {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  )
}

function BookingLookupPage() {
  const [bookingCode, setBookingCode] = useState('')
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([])
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false)
  const [appointmentsError, setAppointmentsError] = useState('')
  const [appointmentListRefresh, setAppointmentListRefresh] = useState(0)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentListItem | null>(null)
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [cancelSuccess, setCancelSuccess] = useState('')

  const canCancel =
    appointment?.status === 'pending' ||
    appointment?.status === 'confirmed'

  useEffect(() => {
    let isMounted = true

    const fetchAppointments = async () => {
      setIsLoadingAppointments(true)
      setAppointmentsError('')

      try {
        const response = await api.get('/appointments')

        if (!isMounted) return

        const result: AppointmentListItem[] = Array.isArray(response.data.data)
          ? response.data.data
          : []

        setAppointments(result)

        setSelectedAppointment((current) => {
          if (!current) return null

          return (
            result.find(
              (item) => item.booking_code === current.booking_code
            ) ?? current
          )
        })
      } catch (error) {
        if (!isMounted) return

        if (isAxiosError(error)) {
          if (!error.response) {
            setAppointmentsError(
              'Tidak dapat terhubung ke server. Periksa koneksi backend Anda.'
            )
          } else {
            setAppointmentsError(
              error.response?.data?.message ||
              'Gagal mengambil daftar appointment.'
            )
          }
        } else {
          setAppointmentsError(
            'Terjadi kesalahan. Silakan coba kembali.'
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingAppointments(false)
        }
      }
    }

    fetchAppointments()

    return () => {
      isMounted = false
    }
  }, [appointmentListRefresh])

  useEffect(() => {
    if (!selectedAppointment) return

    const previousOverflow = document.body.style.overflow

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedAppointment(null)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedAppointment])

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setSearchError('')
    setCancelError('')
    setCancelSuccess('')
    setAppointment(null)
    setShowCancelConfirmation(false)

    const normalizedCode = bookingCode.trim().toUpperCase()

    if (!normalizedCode) {
      setSearchError('Kode booking wajib diisi.')
      return
    }

    if (!/^KLINIK-[A-Z0-9]{6,16}$/.test(normalizedCode)) {
      setSearchError(
        'Format kode booking tidak valid. Periksa kembali kode booking Anda.'
      )
      return
    }

    setIsSearching(true)

    try {
      const response = await api.get(
        `/appointments/booking/${encodeURIComponent(normalizedCode)}`
      )

      if (!response.data.data) {
        setSearchError(
          'Data appointment tidak ditemukan. Periksa kembali kode booking Anda.'
        )
        return
      }

      setAppointment(response.data.data)
    } catch (error) {
      if (isAxiosError(error)) {
        const statusCode = error.response?.status
        const apiMessage = error.response?.data?.message

        if (statusCode === 404) {
          setSearchError(
            'Appointment tidak ditemukan. Pastikan kode booking sudah benar.'
          )
        } else if (statusCode === 400) {
          setSearchError(
            apiMessage || 'Format kode booking tidak valid.'
          )
        } else if (!error.response) {
          setSearchError(
            'Tidak dapat terhubung ke server. Periksa koneksi backend Anda.'
          )
        } else {
          setSearchError(
            apiMessage || 'Terjadi kesalahan. Silakan coba kembali.'
          )
        }
      } else {
        setSearchError('Terjadi kesalahan. Silakan coba kembali.')
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleCancelAppointment = async () => {
    if (!appointment || !canCancel || isCancelling) {
      return
    }

    setIsCancelling(true)
    setCancelError('')
    setCancelSuccess('')

    try {
      const response = await api.patch(
        `/appointments/${appointment.id}/status`,
        {
          status: 'cancelled',
        }
      )

      if (!response.data.data) {
        setCancelError(
          'Pembatalan belum dapat dikonfirmasi. Silakan cari booking kembali.'
        )
        return
      }

      setAppointment(response.data.data)
      setShowCancelConfirmation(false)
      setCancelSuccess('Appointment berhasil dibatalkan.')
      setAppointmentListRefresh((current) => current + 1)

    } catch (error) {
      if (isAxiosError(error)) {
        const statusCode = error.response?.status
        const apiMessage = error.response?.data?.message

        if (statusCode === 400) {
          setCancelError(
            apiMessage ||
              'Appointment tidak dapat dibatalkan. Periksa kembali status appointment.'
          )
        } else if (statusCode === 404) {
          setCancelError('Appointment tidak ditemukan.')
        } else if (!error.response) {
          setCancelError(
            'Tidak dapat terhubung ke server. Silakan coba kembali.'
          )
        } else {
          setCancelError(
            apiMessage || 'Gagal membatalkan appointment.'
          )
        }
      } else {
        setCancelError(
          'Terjadi kesalahan. Silakan coba kembali.'
        )
      }
    } finally {
      setIsCancelling(false)
    }
  }

  const doctorName = appointment
    ? [
        appointment.title_prefix,
        appointment.doctor_name,
        appointment.title_suffix,
      ]
        .filter(Boolean)
        .join(' ')
    : ''

  return (
    <section className="booking-lookup-page">
      <div className="container">
        <div className="booking-lookup-heading">
          <span>INFORMASI APPOINTMENT</span>
          <h1>Cari Janji Temu</h1>
          <p>
            Masukkan kode booking untuk melihat detail janji temu
            Anda.
          </p>
        </div>

        <div className="booking-lookup-card">
          <form
            className="lookup-form"
            onSubmit={handleSearch}
            noValidate
          >
            <div className="form-group">
              <label htmlFor="booking-code">
                Kode Booking
              </label>

              <input
                id="booking-code"
                type="text"
                placeholder="Contoh: KLINIK-97ED638B29"
                value={bookingCode}
                maxLength={23}
                autoComplete="off"
                aria-invalid={Boolean(searchError)}
                aria-describedby={
                  searchError ? 'lookup-search-error' : undefined
                }
                onChange={(event) => {
                  setBookingCode(event.target.value.toUpperCase())
                  setSearchError('')
                  setAppointment(null)
                  setCancelError('')
                  setCancelSuccess('')
                  setShowCancelConfirmation(false)
                }}
              />

              {searchError && (
                <p
                  id="lookup-search-error"
                  className="form-error"
                  role="alert"
                >
                  {searchError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="lookup-search-button"
              disabled={isSearching}
            >
              {isSearching ? 'Mencari...' : 'Cari Booking'}
            </button>
          </form>

          {!appointment && !searchError && (
            <p className="lookup-hint">
              Pastikan kode booking yang dimasukkan sesuai dengan
              kode yang diterima setelah pemesanan.
            </p>
          )}

          {appointment && (
            <div className="lookup-result">
              <div className="lookup-result-heading">
                <div>
                  <span>HASIL PENCARIAN</span>
                  <h2>Detail Appointment</h2>
                </div>

                <span
                  className={`lookup-status lookup-status--${appointment.status}`}
                >
                  {statusLabels[appointment.status]}
                </span>
              </div>

              <div className="lookup-code-box">
                <span>KODE BOOKING</span>
                <strong>{appointment.booking_code}</strong>
              </div>

              <div className="lookup-details">
                <div className="lookup-detail-item">
                  <span>Nama Pasien</span>
                  <strong>{appointment.patient_name}</strong>
                </div>

                <div className="lookup-detail-item">
                  <span>Nomor Telepon</span>
                  <strong>{appointment.patient_phone}</strong>
                </div>

                <div className="lookup-detail-item">
                  <span>Dokter</span>
                  <strong>{doctorName}</strong>
                </div>

                <div className="lookup-detail-item">
                  <span>Spesialisasi</span>
                  <strong>{appointment.doctor_specialization}</strong>
                </div>

                <div className="lookup-detail-item">
                  <span>Tanggal Kunjungan</span>
                  <strong>
                    {formatAppointmentDate(
                      appointment.appointment_date
                    )}
                  </strong>
                </div>

                <div className="lookup-detail-item">
                  <span>Waktu Kunjungan</span>
                  <strong>
                    {appointment.appointment_time.slice(0, 5)} WIB
                  </strong>
                </div>

                <div className="lookup-detail-item">
                  <span>Nomor Ruangan</span>
                  <strong>{appointment.room_number || '-'}</strong>
                </div>

                <div className="lookup-detail-item">
                  <span>Status Appointment</span>
                  <strong
                    className={`lookup-status-text lookup-status-text--${appointment.status}`}
                  >
                    {statusLabels[appointment.status]}
                  </strong>
                </div>
              </div>

              {cancelSuccess && (
                <p
                  className="lookup-feedback lookup-feedback--success"
                  role="status"
                >
                  {cancelSuccess}
                </p>
              )}

              {cancelError && (
                <p
                  className="lookup-feedback lookup-feedback--error"
                  role="alert"
                >
                  {cancelError}
                </p>
              )}

              {canCancel && !showCancelConfirmation && (
                <button
                  type="button"
                  className="lookup-cancel-button"
                  onClick={() => {
                    setCancelError('')
                    setShowCancelConfirmation(true)
                  }}
                >
                  Batalkan Appointment
                </button>
              )}

              {canCancel && showCancelConfirmation && (
                <div className="lookup-cancel-confirmation">
                  <strong>Batalkan Appointment?</strong>

                  <p>
                    Apakah Anda yakin ingin membatalkan janji temu
                    ini? Tindakan ini tidak dapat dikembalikan.
                  </p>

                  <div className="lookup-confirmation-actions">
                    <button
                      type="button"
                      className="lookup-confirm-button"
                      onClick={handleCancelAppointment}
                      disabled={isCancelling}
                    >
                      {isCancelling
                        ? 'Memproses...'
                        : 'Ya, Batalkan'}
                    </button>

                    <button
                      type="button"
                      className="lookup-back-button"
                      onClick={() =>
                        setShowCancelConfirmation(false)
                      }
                      disabled={isCancelling}
                    >
                      Kembali
                    </button>
                  </div>
                </div>
              )}

              {appointment.status === 'cancelled' && (
                <p className="lookup-status-note">
                  Appointment ini sudah dibatalkan dan slot waktu
                  dapat digunakan kembali.
                </p>
              )}

              {appointment.status === 'completed' && (
                <p className="lookup-status-note">
                  Appointment ini sudah selesai sehingga tidak dapat
                  dibatalkan.
                </p>
              )}
            </div>
          )}
        </div>
        <section
          className="appointment-list-section"
          aria-labelledby="appointment-list-title"
        >
          <div className="appointment-list-heading">
            <span>APPOINTMENT TERDAFTAR</span>
            <h2 id="appointment-list-title">
              Daftar Appointment
            </h2>
            <p>
              Berikut merupakan daftar janji temu yang
              telah terdaftar di Mediverse.
            </p>
          </div>

          {isLoadingAppointments ? (
            <p className="appointment-list-message">
              Memuat daftar appointment...
            </p>
          ) : appointmentsError ? (
            <p
              className="appointment-list-message appointment-list-message--error"
              role="alert"
            >
              {appointmentsError}
            </p>
          ) : appointments.length === 0 ? (
            <p className="appointment-list-message">
              Belum ada appointment yang terdaftar.
            </p>
          ) : (
            <div className="appointment-list-grid">
              {appointments.map((item) => {
                const displayDoctorName = [
                  item.title_prefix,
                  item.doctor_name,
                  item.title_suffix,
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <article
                    className="appointment-list-card"
                    key={item.booking_code}
                    role="button"
                    tabIndex={0}
                    aria-haspopup="dialog"
                    aria-label={`Lihat detail appointment ${item.booking_code}`}
                    onClick={() => setSelectedAppointment(item)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelectedAppointment(item)
                      }
                    }}
                  >
                    {/* Header Card */}
                    <div className="appointment-list-card-header">
                      <div className="appointment-list-card-code">
                        <span>KODE BOOKING</span>
                        <h3>{item.booking_code}</h3>
                      </div>

                      <span
                        className={`lookup-status lookup-status--${item.status}`}
                      >
                        {statusLabels[item.status]}
                      </span>
                    </div>

                    {/* Ringkasan Appointment */}
                    <div className="appointment-summary-grid">
                      <div>
                        <span>Nama Pasien</span>
                        <strong>{item.patient_name}</strong>
                      </div>

                      <div>
                        <span>Dokter</span>
                        <strong>{displayDoctorName}</strong>
                        <small>{item.doctor_specialization}</small>
                      </div>

                      <div>
                        <span>Tanggal Appointment</span>
                        <strong>
                          {formatAppointmentDate(item.appointment_date)}
                        </strong>
                      </div>

                      <div>
                        <span>Waktu Appointment</span>
                        <strong>
                          {item.appointment_time.slice(0, 5)} WIB
                        </strong>
                      </div>
                    </div>

                    {/* Footer Card */}
                    <div className="appointment-list-card-footer">
                      <span>Klik kartu untuk melihat informasi lengkap</span>
                      <strong>
                        Lihat Detail <span aria-hidden="true">→</span>
                      </strong>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {selectedAppointment && (
          <div
          className="appointment-modal-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedAppointment(null)
            }
          }}
        >
          <section
            className="appointment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-modal-title"
          >
            <header className="appointment-modal-header">
              <div>
                <span>INFORMASI LENGKAP</span>
                <h2 id="appointment-modal-title">
                  Detail Appointment
                </h2>
              </div>
              <button
                type="button"
                className="appointment-modal-close"
                aria-label="Tutup detail appointment"
                onClick={() => setSelectedAppointment(null)}
              >
                ×
              </button>
            </header>

            <div className="appointment-modal-body">
              <div className="appointment-modal-booking">
                <div>
                  <span>KODE BOOKING</span>
                  <strong>{selectedAppointment.booking_code}</strong>
                </div>

                <span
                  className={`lookup-status lookup-status--${selectedAppointment.status}`}
                >
                  {statusLabels[selectedAppointment.status]}
                </span>
              </div>

              <section className="appointment-modal-section">
                <h3>Informasi Pasien</h3>

                <div className="appointment-modal-grid">
                  <div>
                    <span>Nama Pasien</span>
                    <strong>{selectedAppointment.patient_name}</strong>
                  </div>

                  <div>
                    <span>Nomor Telepon</span>
                    <strong>{selectedAppointment.patient_phone}</strong>
                  </div>
                </div>
              </section>
                <section className="appointment-modal-section">
                  <h3>Informasi Dokter</h3>

                  <div className="appointment-modal-grid">
                    <div>
                      <span>Nama Dokter</span>
                      <strong>
                        {[
                          selectedAppointment.title_prefix,
                          selectedAppointment.doctor_name,
                          selectedAppointment.title_suffix,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      </strong>
                    </div>

                    <div>
                      <span>Spesialisasi</span>
                      <strong>
                        {selectedAppointment.doctor_specialization}
                      </strong>
                    </div>

                    <div>
                      <span>Nomor Ruangan</span>
                      <strong>
                        {selectedAppointment.room_number || '-'}
                      </strong>
                    </div>
                  </div>
                </section>

                <section className="appointment-modal-section">
                  <h3>Jadwal Appointment</h3>

                  <div className="appointment-modal-grid">
                    <div>
                      <span>Tanggal Appointment</span>
                      <strong>
                        {formatAppointmentDate(
                          selectedAppointment.appointment_date
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Waktu Appointment</span>
                      <strong>
                        {selectedAppointment.appointment_time.slice(0, 5)} WIB
                      </strong>
                    </div>
                  </div>
                </section>

                <section className="appointment-modal-section">
                  <h3>Keluhan Pasien</h3>
                  <p className="appointment-modal-complaint">
                    {selectedAppointment.complaint || '-'}
                  </p>
                </section>

                <section className="appointment-modal-section">
                  <h3>Informasi Pendaftaran</h3>
                  <div className="appointment-modal-grid">
                    <div>
                      <span>Dibuat Pada</span>
                      <strong>{selectedAppointment.created_at}</strong>
                    </div>
                    <div>
                      <span>Diperbarui Pada</span>
                      <strong>{selectedAppointment.updated_at}</strong>
                    </div>
                  </div>
                </section>

              </div>
              <footer className="appointment-modal-footer">
                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                >
                  Tutup
                </button>
              </footer>
            </section>
          </div>
        )}
      </div>
    </section>
  )
}

export default BookingLookupPage