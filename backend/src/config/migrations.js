const all = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) reject(error);
      else resolve(rows);
    });
  });

const run = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) {
        reject(error);
      } else {
        resolve({
          lastID: this.lastID,
          changes: this.changes,
        });
      }
    });
  });

const applyMigrations = async (db) => {

  const doctorColumns = await all(
    db,
    "PRAGMA table_info('doctors')"
  );

  const doctorColumnNames = doctorColumns.map(
    (column) => column.name
  );

  if (!doctorColumnNames.includes('title_prefix')) {
    await run(
      db,
      'ALTER TABLE doctors ADD COLUMN title_prefix TEXT'
    );
  }

  if (!doctorColumnNames.includes('title_suffix')) {
    await run(
      db,
      'ALTER TABLE doctors ADD COLUMN title_suffix TEXT'
    );
  }

  const appointmentColumns = await all(
    db,
    "PRAGMA table_info('appointments')"
  );

  const appointmentColumnNames = appointmentColumns.map(
    (column) => column.name
  );

  if (!appointmentColumnNames.includes('booking_code')) {
    await run(
      db,
      'ALTER TABLE appointments ADD COLUMN booking_code TEXT'
    );
  }

  const appointmentsWithoutCode = await all(
    db,
    `SELECT id
     FROM appointments
     WHERE booking_code IS NULL
        OR TRIM(booking_code) = ''
     ORDER BY id ASC`
  );

  for (const appointment of appointmentsWithoutCode) {
    const bookingCode =
      `KLINIK-${String(appointment.id).padStart(6, '0')}`;

    await run(
      db,
      `UPDATE appointments
       SET booking_code = ?
       WHERE id = ?`,
      [bookingCode, appointment.id]
    );
  }

  await run(
    db,
    `CREATE UNIQUE INDEX IF NOT EXISTS
       uq_appointments_booking_code
     ON appointments (booking_code)
     WHERE booking_code IS NOT NULL
       AND booking_code <> ''`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS doctor_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL
        CHECK (day_of_week BETWEEN 0 AND 6),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      slot_duration_minutes INTEGER NOT NULL DEFAULT 30
        CHECK (slot_duration_minutes > 0),
      is_active INTEGER NOT NULL DEFAULT 1
        CHECK (is_active IN (0, 1)),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (doctor_id)
        REFERENCES doctors(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

      CHECK (start_time < end_time),

      UNIQUE (doctor_id, day_of_week, start_time)
    )`
  );

  await run(
    db,
    `CREATE INDEX IF NOT EXISTS
       idx_doctor_schedules_lookup
     ON doctor_schedules (
       doctor_id,
       day_of_week,
       is_active
     )`
  );

  console.log('✅ Migrasi database berhasil diterapkan.');
};

module.exports = { applyMigrations };