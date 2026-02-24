const express = require('express');
const router = express.Router();

const { protect, onlyP, onlyO } = require('../middleware/authmiddleware');

const { registerEvent, getHistory, getParticipants, cancelRegistration, getOrganizerAnalytics, uploadPaymentProof, approvePayment, rejectPayment, getMerchOrders, exportCSV, scanTicket, manualAttendance, getAttendanceDashboard } = require('../controller/registrationcontrol');

router.post('/register', protect, onlyP, registerEvent);
router.get('/history', protect, onlyP, getHistory);
router.delete('/:id', protect, onlyP, cancelRegistration);
router.put('/:id/payment-proof', protect, onlyP, uploadPaymentProof);

router.get('/participants/:eventId', protect, onlyO, getParticipants);
router.get('/analytics', protect, onlyO, getOrganizerAnalytics);
router.get('/merch-orders/:eventId', protect, onlyO, getMerchOrders);
router.put('/:id/approve', protect, onlyO, approvePayment);
router.put('/:id/reject', protect, onlyO, rejectPayment);

// CSV export
router.get('/export/:eventId', protect, onlyO, exportCSV);

// QR Scanner & Attendance
router.post('/scan', protect, onlyO, scanTicket);
router.put('/:id/attend', protect, onlyO, manualAttendance);
router.get('/attendance/:eventId', protect, onlyO, getAttendanceDashboard);

module.exports = router;