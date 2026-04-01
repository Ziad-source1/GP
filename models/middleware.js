// Middleware: require login
exports.requireLogin = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Please login to continue.');
    return res.redirect('/auth/login');
  }
  next();
};

// Middleware: require seller role
exports.requireSeller = (req, res, next) => {
  if (!req.session.user) return res.redirect('/auth/login');
  if (req.session.user.role !== 'seller' && req.session.user.role !== 'admin') {
    req.flash('error', 'Seller account required.');
    return res.redirect('/seller/upgrade');
  }
  next();
};

// Middleware: require admin
exports.requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Admin access required.');
    return res.redirect('/auth/login');
  }
  next();
};

// Mock session user setter
exports.setMockUser = (req, type = 'buyer') => {
  const users = {
    buyer: { id: 2, username: 'GameHunter', email: 'hunter@example.com', role: 'buyer', verified: false, balance: 1200, badge: null },
    seller: { id: 1, username: 'Ahmed_Pro', email: 'ahmed@example.com', role: 'seller', verified: true, balance: 4500, badge: 'premium' },
    admin: { id: 3, username: 'admin', email: 'admin@levelup.gg', role: 'admin', verified: true, balance: 0, badge: 'admin' }
  };
  req.session.user = users[type];
};
