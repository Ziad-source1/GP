const { listings, orders, sellerAnalytics, affiliates, premiumPlans } = require('../models/data');

exports.dashboard = (req, res) => {
  const uid = req.session.user.id;
  const analytics = sellerAnalytics[uid] || sellerAnalytics[1];
  const myListings = listings.filter(l => l.sellerId === uid);
  const myOrders = orders.filter(o => o.sellerId === uid);
  res.render('seller/dashboard', { title: 'Seller Dashboard — LEVEL UP', analytics, listings: myListings, orders: myOrders, user: req.session.user });
};

exports.verificationPage = (req, res) => {
  res.render('seller/verification', { title: 'Seller Verification — LEVEL UP', user: req.session.user });
};

exports.submitVerification = (req, res) => {
  req.flash('success', 'Documents submitted! We\'ll review within 24 hours.');
  res.redirect('/seller/dashboard');
};

exports.createListing = (req, res) => {
  res.render('seller/create-listing', { title: 'Create Listing — LEVEL UP' });
};

exports.saveListing = (req, res) => {
  req.flash('success', 'Listing created successfully!');
  res.redirect('/seller/listings');
};

exports.manageListings = (req, res) => {
  const uid = req.session.user.id;
  const myListings = listings.filter(l => l.sellerId === uid);
  res.render('seller/manage-listings', { title: 'Manage Listings — LEVEL UP', listings: myListings });
};

exports.orderManagement = (req, res) => {
  const uid = req.session.user.id;
  const myOrders = orders.filter(o => o.sellerId === uid);
  res.render('seller/orders', { title: 'Order Management — LEVEL UP', orders: myOrders });
};

exports.earnings = (req, res) => {
  const uid = req.session.user.id;
  const analytics = sellerAnalytics[uid] || sellerAnalytics[1];
  res.render('seller/earnings', { title: 'Earnings & Analytics — LEVEL UP', analytics, user: req.session.user });
};

exports.streak = (req, res) => {
  const uid = req.session.user.id;
  const analytics = sellerAnalytics[uid] || sellerAnalytics[1];
  res.render('seller/streak', { title: 'Trade Streak — LEVEL UP', streak: analytics.streak, user: req.session.user });
};

exports.goal = (req, res) => {
  const uid = req.session.user.id;
  const analytics = sellerAnalytics[uid] || sellerAnalytics[1];
  res.render('seller/goal', { title: 'Trade Goal — LEVEL UP', goal: analytics.goal, analytics, user: req.session.user });
};

exports.affiliate = (req, res) => {
  const uid = req.session.user.id;
  const aff = affiliates.find(a => a.userId === uid) || affiliates[0];
  res.render('seller/affiliate', { title: 'Affiliate Program — LEVEL UP', affiliate: aff, user: req.session.user });
};

exports.premium = (req, res) => {
  res.render('seller/premium', { title: 'Go Premium — LEVEL UP', plans: premiumPlans, user: req.session.user });
};

exports.upgradePremium = (req, res) => {
  req.flash('success', 'Premium plan activated! Welcome to the elite tier.');
  res.redirect('/seller/dashboard');
};
