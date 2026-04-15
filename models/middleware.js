const {updateWalletBalance} = require('./data');
// Authentication middleware
exports.requireLogin = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Please login to access this page');
    return res.redirect('/auth/login');
  }
  next();
};

exports.requireRole = (role) => {
  return (req, res, next) => {
    if (!req.session.user) {
      req.flash('error', 'Please login first');
      return res.redirect('/auth/login');
    }
    if (req.session.user.role !== role && req.session.user.role !== 'admin') {
      req.flash('error', 'Access denied');
      return res.redirect('/');
    }
    next();
  };
};

exports.requireSeller = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Please login first');
    return res.redirect('/auth/login');
  }
  if (req.session.user.role !== 'seller' && req.session.user.role !== 'admin' && req.session.user.is_seller !== 1) {
    req.flash('error', 'Seller access required');
    return res.redirect('/');
  }
  next();
};

exports.requireAdmin = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Please login first');
    return res.redirect('/auth/login');
  }
  if (req.session.user.role !== 'admin') {
    req.flash('error', 'Admin access required');
    return res.redirect('/');
  }
  next();
};

exports.fundWallet = async (req,res) => {
  const { amount } = req.body;
  const newBalance = Number(req.session.user.balance) + Number(amount);
  req.session.user.balance = newBalance;
  await updateWalletBalance(req.session.user.id, newBalance);
  res.redirect('buyer/wallet');
}