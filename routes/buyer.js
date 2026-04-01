const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/buyerController');
const { requireLogin } = require('../models/middleware');

router.use(requireLogin);
router.get('/dashboard', ctrl.dashboard);
router.get('/wallet', ctrl.wallet);
router.get('/orders', ctrl.orderHistory);
router.get('/active-orders', ctrl.activeOrders);
router.get('/disputes', ctrl.disputes);
router.get('/notifications', ctrl.notifications);
router.get('/reviews', ctrl.reviews);
router.get('/checkout/:id', ctrl.checkout);
router.post('/order', ctrl.placeOrder);

module.exports = router;
