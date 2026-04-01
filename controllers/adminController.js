const { users, listings, orders, disputes } = require('../models/data');

exports.dashboard = (req, res) => {
  const stats = {
    users: users.length, sellers: users.filter(u => u.role === 'seller').length,
    listings: listings.length, orders: orders.length,
    revenue: orders.reduce((s, o) => s + o.amount, 0),
    disputes: disputes.filter(d => d.status === 'open').length,
    pendingVerifications: 3
  };
  res.render('admin/dashboard', { title: 'Admin Dashboard — LEVEL UP', stats, recentOrders: orders, users });
};

exports.userManagement = (req, res) => {
  res.render('admin/users', { title: 'User Management — LEVEL UP', users });
};

exports.verificationReview = (req, res) => {
  const pending = [
    { id: 101, username: 'NewSeller1', email: 'new@example.com', submittedAt: '2024-01-28', docType: 'National ID', status: 'pending' },
    { id: 102, username: 'QuickSeller', email: 'quick@example.com', submittedAt: '2024-01-27', docType: 'Passport', status: 'pending' },
    { id: 103, username: 'GamerKing', email: 'king@example.com', submittedAt: '2024-01-26', docType: 'National ID', status: 'pending' }
  ];
  res.render('admin/verification', { title: 'Seller Verification — LEVEL UP', pending });
};

exports.escrowMonitoring = (req, res) => {
  res.render('admin/escrow', { title: 'Escrow Monitor — LEVEL UP', orders });
};

exports.disputeResolution = (req, res) => {
  res.render('admin/disputes', { title: 'Dispute Resolution — LEVEL UP', disputes });
};

exports.fraudDetection = (req, res) => {
  const flags = [
    { id: 1, user: 'SuspiciousAcc', reason: 'Multiple failed payment attempts', severity: 'high', time: '2 hours ago' },
    { id: 2, user: 'FakeDelivery22', reason: 'Dispute rate above 30%', severity: 'high', time: '5 hours ago' },
    { id: 3, user: 'BulkBuyer01', reason: 'Unusual bulk purchasing pattern', severity: 'medium', time: '1 day ago' }
  ];
  res.render('admin/fraud', { title: 'Fraud Detection — LEVEL UP', flags });
};

exports.commissionControl = (req, res) => {
  res.render('admin/commission', { title: 'Commission Control — LEVEL UP' });
};

exports.featuredControl = (req, res) => {
  const featuredListings = listings.filter(l => l.featured);
  res.render('admin/featured', { title: 'Featured Listings — LEVEL UP', listings, featured: featuredListings });
};

exports.approveVerification = (req, res) => {
  req.flash('success', 'Seller verified successfully!');
  res.redirect('/admin/verification');
};

exports.rejectVerification = (req, res) => {
  req.flash('error', 'Seller verification rejected.');
  res.redirect('/admin/verification');
};
