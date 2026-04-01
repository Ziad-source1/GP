const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { requireAdmin } = require('../models/middleware');

router.use(requireAdmin);
router.get('/dashboard', ctrl.dashboard);
router.get('/users', ctrl.userManagement);
router.get('/verification', ctrl.verificationReview);
router.post('/verification/:id/approve', ctrl.approveVerification);
router.post('/verification/:id/reject', ctrl.rejectVerification);
router.get('/escrow', ctrl.escrowMonitoring);
router.get('/disputes', ctrl.disputeResolution);
router.get('/fraud', ctrl.fraudDetection);
router.get('/commission', ctrl.commissionControl);
router.get('/featured', ctrl.featuredControl);

module.exports = router;
