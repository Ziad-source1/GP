const express = require('express');
const router = express.Router();
const { requireLogin, requireAdmin } = require('../models/middleware');
const adminController = require('../controllers/adminController');

router.use(requireLogin);
router.use(requireAdmin);

router.get('/dashboard',    adminController.dashboard);
router.get('/users',        adminController.userManagement);
router.get('/verification', adminController.verificationReview);
router.get('/escrow',       adminController.escrowMonitoring);
router.get('/disputes',     adminController.disputeResolution);
router.get('/fraud',        adminController.fraudDetection);
router.get('/commission',   adminController.commissionControl);
router.get('/featured',     adminController.featuredControl);

router.post('/verification/:id/approve', adminController.approveVerification);
router.post('/verification/:id/reject',  adminController.rejectVerification);
router.post('/escrow/:id/release', adminController.releaseEscrow);

router.post('/disputes/:id/refund-buyer',   adminController.resolveRefundBuyer);
router.post('/disputes/:id/release-seller', adminController.resolveReleaseSeller);

module.exports = router;