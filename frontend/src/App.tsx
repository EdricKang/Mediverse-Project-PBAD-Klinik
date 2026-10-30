import { Link, Route, Routes } from 'react-router-dom'
import './App.css'

function HomePage() {
  return <h1>Halaman Utama Mediverse</h1>
}

function BookingPage() {
  return <h1>Halaman Pemesanan Appointment</h1>
}

function BookingSuccessPage() {
  return <h1>Halaman Konfirmasi Booking</h1>
}

function BookingLookupPage() {
  return <h1>Halaman Pencarian Booking</h1>
}

function NotFoundPage() {
  return <h1>Halaman Tidak Ditemukan</h1>
}

function App() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link> |{' '}
        <Link to="/booking">Booking</Link> |{' '}
        <Link to="/booking/success">Konfirmasi</Link> |{' '}
        <Link to="/booking/lookup">Cari Booking</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/booking/success" element={<BookingSuccessPage />} />
        <Route path="/booking/lookup" element={<BookingLookupPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App