const express = require('express');
const router = express.Router();

const appointmentController = require('../controllers/appointmentController');

router.get(
  '/available-slots',
  appointmentController.getAvailableSlots
);

router.get('/', appointmentController.getAllAppointments);
router.get('/:id', appointmentController.getAppointmentById);

router.post('/', appointmentController.createAppointment);

router.patch(
  '/:id/status',
  appointmentController.updateAppointmentStatus
);

router.put('/:id', appointmentController.updateAppointment);

module.exports = router;