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
        CHECK (day_of_week BETWEEN 1 AND 7),
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

  // Membuat tabel ruangan jika belum tersedia.
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT NOT NULL UNIQUE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );

  // Menyiapkan nomor ruangan awal.
  await run(
    db,
    `INSERT OR IGNORE INTO rooms (room_number)
     VALUES ('203'), ('244'), ('305')`
  );

  // Menambahkan room_id ke database lama jika belum tersedia.
  const doctorColumnsForRoom = await all(
    db,
    "PRAGMA table_info('doctors')"
  );

  const doctorColumnNamesForRoom =
    doctorColumnsForRoom.map((column) => column.name);

  if (!doctorColumnNamesForRoom.includes('room_id')) {
    await run(
      db,
      'ALTER TABLE doctors ADD COLUMN room_id INTEGER REFERENCES rooms(id)'
    );
  }

  // Menghubungkan dokter lama dengan ruangan.
  // ID 1 menggunakan 203, ID 2 menggunakan 244.
  // Dokter lain yang belum memiliki ruangan mendapatkan nomor
  // berdasarkan ID agar datanya tidak hilang.
  const doctorsWithoutRoom = await all(
    db,
    `SELECT id
     FROM doctors
     WHERE room_id IS NULL
     ORDER BY id ASC`
  );

  for (const doctor of doctorsWithoutRoom) {
    const doctorId = Number(doctor.id);

    const roomNumber =
      doctorId === 1
        ? '203'
        : doctorId === 2
          ? '244'
          : String(300 + doctorId);

    await run(
      db,
      `INSERT OR IGNORE INTO rooms (room_number)
       VALUES (?)`,
      [roomNumber]
    );

    const roomRows = await all(
      db,
      'SELECT id FROM rooms WHERE room_number = ?',
      [roomNumber]
    );

    if (roomRows.length === 0) {
      throw new Error(
        `Ruangan ${roomNumber} tidak ditemukan`
      );
    }

    await run(
      db,
      `UPDATE doctors
       SET room_id = ?
       WHERE id = ?
         AND room_id IS NULL`,
      [roomRows[0].id, doctorId]
    );
  }

  await run(
    db,
    `CREATE UNIQUE INDEX IF NOT EXISTS uq_doctors_room_id
     ON doctors (room_id)
     WHERE room_id IS NOT NULL`
  );

  const scheduleSchemaForDayChange = await all(
    db,
    `SELECT sql
     FROM sqlite_master
     WHERE type = 'table'
       AND name = 'doctor_schedules'`
  );

  if (scheduleSchemaForDayChange.length > 0) {
    const scheduleSql =
      scheduleSchemaForDayChange[0].sql || '';

    if (/BETWEEN\s+0\s+AND\s+6/i.test(scheduleSql)) {

      await run(db, 'BEGIN TRANSACTION');

      try {
        await run(
          db,
          'DROP TABLE IF EXISTS doctor_schedules_new'
        );

        await run(
          db,
          `CREATE TABLE doctor_schedules_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doctor_id INTEGER NOT NULL,
            day_of_week INTEGER NOT NULL
              CHECK (day_of_week BETWEEN 1 AND 7),
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
          `INSERT INTO doctor_schedules_new (
            id,
            doctor_id,
            day_of_week,
            start_time,
            end_time,
            slot_duration_minutes,
            is_active,
            created_at,
            updated_at
          )
          SELECT
            id,
            doctor_id,
            CASE
              WHEN day_of_week = 0 THEN 7
              ELSE day_of_week
            END,
            start_time,
            end_time,
            slot_duration_minutes,
            is_active,
            created_at,
            updated_at
          FROM doctor_schedules`
        );

        await run(db, 'DROP TABLE doctor_schedules');

        await run(
          db,
          `ALTER TABLE doctor_schedules_new
           RENAME TO doctor_schedules`
        );

        await run(
          db,
          `CREATE INDEX IF NOT EXISTS idx_doctor_schedules_lookup
           ON doctor_schedules (
             doctor_id,
             day_of_week,
             is_active
           )`
        );

        await run(db, 'COMMIT');
      } catch (error) {
        await run(db, 'ROLLBACK');
        throw error;
      }
    }
  }

  console.log('✅ Migrasi database berhasil diterapkan.');
};

module.exports = { applyMigrations };