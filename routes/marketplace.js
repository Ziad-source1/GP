const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplaceController');

router.get('/', marketplaceController.browse);
router.get('/category/:cat', marketplaceController.category);
router.get('/listing/:id', marketplaceController.listing);
router.get('/seller/:id', marketplaceController.sellerProfile);

module.exports = router;