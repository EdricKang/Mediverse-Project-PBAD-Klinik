PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS test_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name      TEXT NOT NULL,
    phone          TEXT NOT NULL,
    email          TEXT,
    date_of_birth  TEXT,
    gender         TEXT,
    address        TEXT,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name      TEXT NOT NULL,
    specialization TEXT NOT NULL,
    phone          TEXT,
    email          TEXT,
    is_active      INTEGER NOT NULL DEFAULT 1,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS appointments (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id       INTEGER NOT NULL,
    doctor_id        INTEGER NOT NULL,
    appointment_date TEXT NOT NULL, -- Expected format: YYYY-MM-DD
    appointment_time TEXT NOT NULL, -- Expected format: HH:MM (24-hour)
    complaint        TEXT,
    status           TEXT NOT NULL DEFAULT 'pending',
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_appointments_patient
        FOREIGN KEY (patient_id) REFERENCES patients(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_doctor_slot_active
ON appointments (doctor_id, appointment_date, appointment_time)
WHERE status IN ('pending', 'confirmed');

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_patient_slot_active
ON appointments (patient_id, appointment_date, appointment_time)
WHERE status IN ('pending', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_appointments_date
ON appointments (appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_patient
ON appointments (patient_id);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date
ON appointments (doctor_id, appointment_date);
