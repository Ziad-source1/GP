const { faqs, premiumPlans } = require('../models/data');

exports.about = (req, res) => res.render('pages/about', { title: 'About LEVEL UP' });
exports.howEscrow = (req, res) => res.render('pages/how-escrow', { title: 'How Escrow Works — LEVEL UP' });
exports.premiumSeller = (req, res) => res.render('pages/premium-seller', { title: 'Premium Seller — LEVEL UP', plans: premiumPlans });
exports.affiliateProgram = (req, res) => res.render('pages/affiliate-program', { title: 'Affiliate Program — LEVEL UP' });
exports.faq = (req, res) => res.render('pages/faq', { title: 'FAQ — LEVEL UP', faqs });
exports.contact = (req, res) => res.render('pages/contact', { title: 'Contact & Support — LEVEL UP' });
exports.terms = (req, res) => res.render('pages/terms', { title: 'Terms & Conditions — LEVEL UP' });
exports.privacy = (req, res) => res.render('pages/privacy', { title: 'Privacy Policy — LEVEL UP' });
exports.sendContact = (req, res) => {
  req.flash('success', 'Message sent! We\'ll respond within 24 hours.');
  res.redirect('/pages/contact');
};
