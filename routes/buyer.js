const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyerController');
const { requireLogin } = require('../models/middleware');

router.use(requireLogin);

router.get('/dashboard', buyerController.dashboard);
router.get('/wallet', buyerController.wallet);
// router.get('/order-history', buyerController.orderHistory);
router.get('/orders', buyerController.getOrders);
router.post('/orders/:order_id/complete', buyerController.completeOrders);
router.get('/disputes', buyerController.disputes);
router.post('/disputes', buyerController.postDispute);
router.get('/notifications', buyerController.notifications);
router.get('/reviews', buyerController.reviews);
router.get('/reviews', buyerController.reviews);
router.get('/orders/:order_id/review',  buyerController.getReviewForm);
router.post('/orders/:order_id/review', buyerController.postReview);
router.get('/checkout/:id', buyerController.checkout);
router.post('/place-order', buyerController.placeOrder);

module.exports = router;