const all = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) reject(error);
      else resolve(rows);
    });
  });

const get = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) reject(error);
      else resolve(row);
    });
  });

const run = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) reject(error);
      else resolve({
        lastID: this.lastID,
        changes: this.changes,
      });
    });
  });

const migrateDoctorRoomNumber = async (db) => {
  const columns = await all(db, "PRAGMA table_info('doctors')");
  const names = columns.map((column) => column.name);

  const hasRoomId = names.includes('room_id');
  const hasRoomNumber = names.includes('room_number');

  const roomsTable = await get(
    db,
    `SELECT name
     FROM sqlite_master
     WHERE type = 'table' AND name = 'rooms'`
  );

  if (hasRoomNumber && !hasRoomId) {
    if (roomsTable) {
      await run(db, 'PRAGMA foreign_keys = OFF');

      try {
        await run(db, 'BEGIN TRANSACTION');
        await run(db, 'DROP TABLE IF EXISTS rooms');
        await run(db, 'COMMIT');
      } catch (error) {
        await run(db, 'ROLLBACK').catch(() => {});
        throw error;
      } finally {
        await run(db, 'PRAGMA foreign_keys = ON');
      }
    }

    return;
  }

  let doctors;

  if (hasRoomId && roomsTable) {
    doctors = await all(
      db,
      `SELECT d.*,
              r.room_number AS old_room_number
       FROM doctors d
       LEFT JOIN rooms r ON r.id = d.room_id
       ORDER BY d.id`
    );
  } else {
    doctors = await all(
      db,
      'SELECT * FROM doctors ORDER BY id'
    );
  }

  const usedNumbers = new Set();

  const migratedDoctors = doctors.map((doctor) => {
    let roomNumber =
      typeof doctor.room_number === 'string'
        ? doctor.room_number.trim()
        : '';

    if (
      !roomNumber &&
      typeof doctor.old_room_number === 'string'
    ) {
      roomNumber = doctor.old_room_number.trim();
    }

    if (!roomNumber) {
      roomNumber = String(300 + Number(doctor.id));

      while (usedNumbers.has(roomNumber)) {
        roomNumber = String(Number(roomNumber) + 1);
      }
    }

    if (usedNumbers.has(roomNumber)) {
      throw new Error(
        `Nomor ruangan ${roomNumber} digunakan lebih dari sekali. ` +
        'Periksa data dokter sebelum melanjutkan migrasi.'
      );
    }

    usedNumbers.add(roomNumber);

    return {
      ...doctor,
      migrated_room_number: roomNumber,
    };
  });

  await run(db, 'PRAGMA foreign_keys = OFF');

  try {
    await run(db, 'BEGIN TRANSACTION');
    await run(db, 'DROP TABLE IF EXISTS doctors_new');

    await run(
      db,
      `CREATE TABLE doctors_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title_prefix TEXT,
        full_name TEXT NOT NULL,
        title_suffix TEXT,
        specialization TEXT NOT NULL,
        room_number TEXT NOT NULL UNIQUE,
        phone TEXT,
        email TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK (is_active IN (0, 1))
      )`
    );

    for (const doctor of migratedDoctors) {
      await run(
        db,
        `INSERT INTO doctors_new (
          id,
          title_prefix,
          full_name,
          title_suffix,
          specialization,
          room_number,
          phone,
          email,
          is_active,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          doctor.id,
          doctor.title_prefix ?? null,
          doctor.full_name,
          doctor.title_suffix ?? null,
          doctor.specialization,
          doctor.migrated_room_number,
          doctor.phone ?? null,
          doctor.email ?? null,
          doctor.is_active ?? 1,
          doctor.created_at || null,
          doctor.updated_at || null,
        ]
      );
    }

    await run(db, 'DROP TABLE doctors');
    await run(
      db,
      'ALTER TABLE doctors_new RENAME TO doctors'
    );

    await run(db, 'DROP TABLE IF EXISTS rooms');
    await run(db, 'COMMIT');
  } catch (error) {
    await run(db, 'ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await run(db, 'PRAGMA foreign_keys = ON');
  }

  const problems = await all(db, 'PRAGMA foreign_key_check');

  if (problems.length > 0) {
    throw new Error(
      'Migrasi selesai, tetapi ditemukan masalah foreign key: ' +
      JSON.stringify(problems)
    );
  }
};

const applyMigrations = async (db) => {
  let doctorColumns = await all(
    db,
    "PRAGMA table_info('doctors')"
  );

  let doctorColumnNames = doctorColumns.map(
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

  await migrateDoctorRoomNumber(db);

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
     ORDER BY id`
  );

  for (const appointment of appointmentsWithoutCode) {
    await run(
      db,
      `UPDATE appointments
       SET booking_code = ?
       WHERE id = ?`,
      [
        `KLINIK-${String(appointment.id).padStart(6, '0')}`,
        appointment.id,
      ]
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
    `CREATE INDEX IF NOT EXISTS idx_doctor_schedules_lookup
     ON doctor_schedules (
       doctor_id,
       day_of_week,
       is_active
     )`
  );

  const scheduleSchema = await all(
    db,
    `SELECT sql
     FROM sqlite_master
     WHERE type = 'table'
       AND name = 'doctor_schedules'`
  );

  if (scheduleSchema.length > 0) {
    const schemaSql = scheduleSchema[0].sql || '';

    if (/BETWEEN\s+0\s+AND\s+6/i.test(schemaSql)) {
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
            CASE WHEN day_of_week = 0 THEN 7 ELSE day_of_week END,
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
        await run(db, 'ROLLBACK').catch(() => {});
        throw error;
      }
    }
  }

  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_appointments_date
     ON appointments (appointment_date)`
  );

  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_appointments_patient
     ON appointments (patient_id)`
  );

  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date
     ON appointments (doctor_id, appointment_date)`
  );

  console.log('Migrasi database berhasil diterapkan.');
};

module.exports = { applyMigrations };