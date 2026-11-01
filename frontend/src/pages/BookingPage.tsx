function BookingPage() {
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