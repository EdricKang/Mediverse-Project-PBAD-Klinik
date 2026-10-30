import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Link to="/" className="brand">
          <span className="brand-icon">M</span>
          <span>Mediverse</span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Beranda</Link>
          <a href="#daftar-dokter">Daftar Dokter</a>
          <Link to="/booking/lookup">Cari Booking</Link>
        </nav>

        <Link to="/booking" className="nav-button">
          Buat Janji Temu
        </Link>
      </div>
    </header>
  )
}

export default Navbar