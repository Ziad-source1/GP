const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/indexController');
router.get('/', ctrl.home);
module.exports = router;
