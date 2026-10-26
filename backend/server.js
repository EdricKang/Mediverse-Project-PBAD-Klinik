require('dotenv').config();

const express = require('express');
const cors = require('cors');

const {
  initializeDatabase,
} = require('./src/config/database');

const patientRoutes = require('./src/routes/patientRoutes');
const doctorRoutes = require('./src/routes/doctorRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const doctorScheduleRoutes = require('./src/routes/doctorScheduleRoutes');
const roomRoutes = require('./src/routes/roomRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Mediverse Clinic Appointment API is running',
    endpoints: {
      patients: '/api/patients',
      doctors: '/api/doctors',
      rooms: '/api/rooms',
      doctorSchedules: '/api/doctor-schedules',
      appointments: '/api/appointments',
    },
  });
});

app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctor-schedules', doctorScheduleRoutes);
app.use('/api/rooms', roomRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
  });
});

async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(
        `Clinic Appointment API berjalan di http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      'Gagal menginisialisasi database:',
      error
    );

    process.exit(1);
  }
}

startServer();
