const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pagesController');

router.get('/about', ctrl.about);
router.get('/how-escrow', ctrl.howEscrow);
router.get('/premium-seller', ctrl.premiumSeller);
router.get('/affiliate-program', ctrl.affiliateProgram);
router.get('/faq', ctrl.faq);
router.get('/contact', ctrl.contact);
router.post('/contact', ctrl.sendContact);
router.get('/terms', ctrl.terms);
router.get('/privacy', ctrl.privacy);

module.exports = router;
