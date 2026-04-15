const express = require('express');
const router = express.Router();
const { requireLogin, requireAdmin } = require('../models/middleware');
const adminController = require('../controllers/adminController');

router.use(requireLogin);
router.use(requireAdmin);

router.get('/dashboard', adminController.dashboard);

router.get('/users', (req, res) => {
  res.render('admin/users', { title: 'Manage Users', user: req.session.user });
});

module.exports = router;