const express = require('express');
const router = express.Router();

const doctorScheduleController = require(
  '../controllers/doctorScheduleController'
);

router.get('/', doctorScheduleController.getAllSchedules);
router.get('/:id', doctorScheduleController.getScheduleById);
router.post('/', doctorScheduleController.createSchedule);
router.put('/:id', doctorScheduleController.updateSchedule);

router.patch(
  '/:id/status',
  doctorScheduleController.updateScheduleStatus
);

module.exports = router;