const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/marketplaceController');

router.get('/', ctrl.browse);
router.get('/category/:cat', ctrl.category);
router.get('/listing/:id', ctrl.listing);
router.get('/seller/:id', ctrl.sellerProfile);

module.exports = router;
