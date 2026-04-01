const { orders, walletTransactions, notifications, disputes, listings } = require('../models/data');

exports.dashboard = (req, res) => {
  const userOrders = orders.filter(o => o.buyerId === req.session.user.id);
  const active = userOrders.filter(o => o.status === 'in_progress');
  const completed = userOrders.filter(o => o.status === 'completed');
  res.render('buyer/dashboard', { title: 'Buyer Dashboard — LEVEL UP', orders: userOrders, active, completed, user: req.session.user });
};

exports.wallet = (req, res) => {
  const txns = walletTransactions.filter(t => t.userId === req.session.user.id);
  res.render('buyer/wallet', { title: 'My Wallet — LEVEL UP', transactions: txns, user: req.session.user });
};

exports.orderHistory = (req, res) => {
  const userOrders = orders.filter(o => o.buyerId === req.session.user.id);
  res.render('buyer/order-history', { title: 'Order History — LEVEL UP', orders: userOrders });
};

exports.activeOrders = (req, res) => {
  const active = orders.filter(o => o.buyerId === req.session.user.id && o.status === 'in_progress');
  res.render('buyer/active-orders', { title: 'Active Orders — LEVEL UP', orders: active });
};

exports.disputes = (req, res) => {
  const userDisputes = disputes.filter(d => d.buyerId === req.session.user.id);
  res.render('buyer/disputes', { title: 'Disputes — LEVEL UP', disputes: userDisputes });
};

exports.notifications = (req, res) => {
  const userNotifs = notifications.filter(n => n.userId === req.session.user.id);
  res.render('buyer/notifications', { title: 'Notifications — LEVEL UP', notifications: userNotifs });
};

exports.reviews = (req, res) => {
  res.render('buyer/reviews', { title: 'My Reviews — LEVEL UP', reviews: [] });
};

exports.checkout = (req, res) => {
  const listing = listings.find(l => l.id === parseInt(req.params.id));
  if (!listing) return res.redirect('/marketplace');
  res.render('buyer/checkout', { title: 'Checkout — LEVEL UP', listing, user: req.session.user });
};

exports.placeOrder = (req, res) => {
  req.flash('success', 'Order placed! Funds held in escrow. Seller has been notified.');
  res.redirect('/buyer/active-orders');
};
