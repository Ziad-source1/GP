const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sellerController');
const { requireLogin } = require('../models/middleware');

router.use(requireLogin);
router.get('/dashboard', ctrl.dashboard);
router.get('/verification', ctrl.verificationPage);
router.post('/verification', ctrl.submitVerification);
router.get('/create-listing', ctrl.createListing);
router.post('/create-listing', ctrl.saveListing);
router.get('/listings', ctrl.manageListings);
router.get('/orders', ctrl.orderManagement);
router.get('/earnings', ctrl.earnings);
router.get('/streak', ctrl.streak);
router.get('/goal', ctrl.goal);
router.get('/affiliate', ctrl.affiliate);
router.get('/premium', ctrl.premium);
router.post('/premium', ctrl.upgradePremium);
router.get('/upgrade', ctrl.premium);

module.exports = router;
