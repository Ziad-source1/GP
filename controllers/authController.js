const { setMockUser } = require('../models/middleware');

exports.loginPage = (req, res) => res.render('auth/login', { title: 'Login — LEVEL UP' });
exports.registerPage = (req, res) => res.render('auth/register', { title: 'Create Account — LEVEL UP' });
exports.verifyPage = (req, res) => res.render('auth/verify', { title: 'Verify Email — LEVEL UP' });
exports.forgotPage = (req, res) => res.render('auth/forgot', { title: 'Reset Password — LEVEL UP' });

exports.login = (req, res) => {
  const { email, role } = req.body;
  // Mock login — set user based on role param or email
  if (email === 'admin@levelup.gg') setMockUser(req, 'admin');
  else if (role === 'seller' || email.includes('ahmed')) setMockUser(req, 'seller');
  else setMockUser(req, 'buyer');
  req.flash('success', 'Welcome back!');
  const r = req.session.user.role;
  if (r === 'admin') return res.redirect('/admin/dashboard');
  if (r === 'seller') return res.redirect('/seller/dashboard');
  res.redirect('/buyer/dashboard');
};

exports.register = (req, res) => {
  setMockUser(req, 'buyer');
  req.flash('success', 'Account created! Please verify your email.');
  res.redirect('/auth/verify');
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

exports.demoLogin = (req, res) => {
  const { type } = req.params;
  setMockUser(req, type || 'buyer');
  const r = req.session.user.role;
  if (r === 'admin') return res.redirect('/admin/dashboard');
  if (r === 'seller') return res.redirect('/seller/dashboard');
  res.redirect('/buyer/dashboard');
};
