PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS rooms (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    room_number  TEXT NOT NULL UNIQUE,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    title_prefix   TEXT,
    full_name      TEXT NOT NULL,
    title_suffix   TEXT,
    specialization TEXT NOT NULL,
    room_id        INTEGER NOT NULL UNIQUE,
    phone          TEXT,
    email          TEXT,
    is_active      INTEGER NOT NULL DEFAULT 1,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_doctors_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS doctor_schedules (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id              INTEGER NOT NULL,
    day_of_week            INTEGER NOT NULL
        CHECK (day_of_week BETWEEN 1 AND 7),
    start_time             TEXT NOT NULL,
    end_time               TEXT NOT NULL,
    slot_duration_minutes  INTEGER NOT NULL DEFAULT 30
        CHECK (slot_duration_minutes > 0),
    is_active              INTEGER NOT NULL DEFAULT 1,
    created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_doctor_schedules_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CHECK (start_time < end_time),
    CHECK (is_active IN (0, 1)),

    UNIQUE (doctor_id, day_of_week, start_time)
);

CREATE TABLE IF NOT EXISTS appointments (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id       INTEGER NOT NULL,
    doctor_id        INTEGER NOT NULL,
    booking_code     TEXT,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    complaint        TEXT,
    status           TEXT NOT NULL DEFAULT 'pending',
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_appointments_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_appointments_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CHECK (
        status IN (
            'pending',
            'confirmed',
            'completed',
            'cancelled'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_doctor_schedules_lookup
ON doctor_schedules (
    doctor_id,
    day_of_week,
    is_active
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_doctor_slot_active
ON appointments (
    doctor_id,
    appointment_date,
    appointment_time
)
WHERE status IN ('pending', 'confirmed');

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_patient_slot_active
ON appointments (
    patient_id,
    appointment_date,
    appointment_time
)
WHERE status IN ('pending', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_appointments_date
ON appointments (appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_patient
ON appointments (patient_id);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date
ON appointments (doctor_id, appointment_date);
