import { useState, type FormEvent } from 'react'
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

  const [showCancelConfirmation, setShowCancelConfirmation] =
    useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [cancelSuccess, setCancelSuccess] = useState('')

  const canCancel =
    appointment?.status === 'pending' ||
    appointment?.status === 'confirmed'

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
      </div>
    </section>
  )
}

export default BookingLookupPage