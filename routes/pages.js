const express = require('express');
const router = express.Router();

router.get('/about', (req, res) => {
  res.render('pages/about', { title: 'About Us', user: req.session.user || null });
});

router.get('/contact', (req, res) => {
  res.render('pages/contact', { title: 'Contact', user: req.session.user || null });
});

router.get('/faq', (req, res) => {
  res.render('pages/faq', { title: 'FAQ', user: req.session.user || null });
});

router.get('/privacy', (req, res) => {
  res.render('pages/privacy', { title: 'Privacy Policy', user: req.session.user || null });
});

router.get('/terms', (req, res) => {
  res.render('pages/terms', { title: 'Terms of Service', user: req.session.user || null });
});

module.exports = router;