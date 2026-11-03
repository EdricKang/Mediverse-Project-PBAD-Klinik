import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const location = useLocation()

  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return

    const targetId = decodeURIComponent(location.hash.slice(1))

    document.getElementById(targetId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [location.pathname, location.hash])

  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Link to="/" className="brand">
          <span className="brand-icon">M</span>
          <span>Mediverse</span>
        </Link>

        <nav className="nav-links">
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Beranda
          </Link>
          <Link to="/#daftar-dokter">Daftar Dokter</Link>
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