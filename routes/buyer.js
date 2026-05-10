const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyerController');
const { requireLogin } = require('../models/middleware');

router.use(requireLogin);

router.get('/dashboard', buyerController.dashboard);
router.get('/wallet', buyerController.wallet);
// router.get('/order-history', buyerController.orderHistory);
router.get('/orders', buyerController.getOrders);
router.get('/disputes', buyerController.disputes);
router.get('/notifications', buyerController.notifications);
router.get('/reviews', buyerController.reviews);
router.get('/checkout/:id', buyerController.checkout);
router.post('/place-order', buyerController.placeOrder);

module.exports = router;