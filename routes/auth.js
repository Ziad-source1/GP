const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');

router.get('/login', ctrl.loginPage);
router.post('/login', ctrl.login);
router.get('/register', ctrl.registerPage);
router.post('/register', ctrl.register);
router.get('/verify', ctrl.verifyPage);
router.get('/forgot', ctrl.forgotPage);
router.get('/logout', ctrl.logout);
router.get('/demo/:type', ctrl.demoLogin);

module.exports = router;
