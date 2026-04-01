const { categories, listings, users } = require('../models/data');

exports.home = (req, res) => {
  const featured = listings.filter(l => l.featured).slice(0, 6);
  const recent = listings.slice(-4).reverse();
  const topSellers = users.filter(u => u.role === 'seller').slice(0, 4);
  res.render('index', { title: 'LEVEL UP — Gaming Marketplace Egypt', categories, featured, recent, topSellers });
};
