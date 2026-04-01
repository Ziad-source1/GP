const { categories, listings, users, reviews } = require('../models/data');

exports.browse = (req, res) => {
  const { search, sort, min, max } = req.query;
  let filtered = [...listings];
  if (search) filtered = filtered.filter(l => l.title.toLowerCase().includes(search.toLowerCase()) || l.game.toLowerCase().includes(search.toLowerCase()));
  if (min) filtered = filtered.filter(l => l.price >= Number(min));
  if (max) filtered = filtered.filter(l => l.price <= Number(max));
  if (sort === 'price_asc') filtered.sort((a, b) => a.price - b.price);
  else if (sort === 'price_desc') filtered.sort((a, b) => b.price - a.price);
  else if (sort === 'popular') filtered.sort((a, b) => b.sales - a.sales);
  else filtered.sort((a, b) => b.featured - a.featured);
  res.render('marketplace/browse', { title: 'Marketplace — LEVEL UP', listings: filtered, categories, query: req.query });
};

exports.category = (req, res) => {
  const { cat } = req.params;
  const category = categories.find(c => c.id === cat);
  if (!category) return res.redirect('/marketplace');
  const filtered = listings.filter(l => l.category === cat);
  res.render('marketplace/category', { title: `${category.name} — LEVEL UP`, category, listings: filtered, categories });
};

exports.listing = (req, res) => {
  const listing = listings.find(l => l.id === parseInt(req.params.id));
  if (!listing) return res.status(404).render('pages/404', { title: '404' });
  const seller = users.find(u => u.id === listing.sellerId);
  const sellerListings = listings.filter(l => l.sellerId === listing.sellerId && l.id !== listing.id).slice(0, 4);
  const listingReviews = reviews.filter(r => r.sellerId === listing.sellerId);
  res.render('marketplace/listing', { title: `${listing.title} — LEVEL UP`, listing, seller, sellerListings, reviews: listingReviews });
};

exports.sellerProfile = (req, res) => {
  const seller = users.find(u => u.id === parseInt(req.params.id));
  if (!seller || seller.role === 'admin') return res.status(404).render('pages/404', { title: '404' });
  const sellerListings = listings.filter(l => l.sellerId === seller.id);
  const sellerReviews = reviews.filter(r => r.sellerId === seller.id);
  res.render('marketplace/seller-profile', { title: `${seller.username} — LEVEL UP`, seller, listings: sellerListings, reviews: sellerReviews });
};
