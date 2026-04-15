const { getAllOffers, getOfferById, getOffersBySeller } = require('../models/data');

// Browse marketplace
exports.browse = async (req, res) => {
  try {
    let offers = await getAllOffers() || [];
    const { search } = req.query;
    
    let listings = offers.map(offer => ({
      id: offer.id,
      title: offer.product_name || offer.service_name,
      price: offer.price,
      description: offer.description,
      image: offer.product_image || null,
      sellerName: offer.seller_name || 'Seller',
      stock: offer.stock
    }));
    
    if (search) {
      listings = listings.filter(l => l.title?.toLowerCase().includes(search.toLowerCase()));
    }
    
    const categories = [
      { id: 'all', name: 'All', icon: '🎮', count: listings.length },
      { id: 'FIFA', name: 'FIFA Coins', icon: '⚽', count: listings.filter(l => l.title?.includes('FIFA')).length },
      { id: 'Fortnite', name: 'Fortnite', icon: '🎯', count: listings.filter(l => l.title?.includes('Fortnite')).length }
    ];
    
    res.render('marketplace/browse', {
      title: 'Marketplace — LEVEL UP',
      listings: listings,
      categories: categories,
      user: req.session.user || null,
      query: { search: search || '' }
    });
  } catch (error) {
    console.error('Browse error:', error);
    res.render('marketplace/browse', { 
      title: 'Marketplace — LEVEL UP',
      listings: [], 
      categories: [], 
      user: req.session.user || null, 
      query: {} 
    });
  }
};

// Category view
exports.category = async (req, res) => {
  try {
    const categoryName = req.params.cat;
    let offers = await getAllOffers() || [];
    
    let filteredOffers = offers.filter(o => 
      o.service_name?.toLowerCase().includes(categoryName.toLowerCase()) ||
      o.product_name?.toLowerCase().includes(categoryName.toLowerCase())
    );
    
    const listings = filteredOffers.map(offer => ({
      id: offer.id,
      title: offer.product_name || offer.service_name,
      price: offer.price,
      description: offer.description,
      image: offer.image || null,
      sellerName: offer.seller_name || 'Seller',
      stock: offer.stock
    }));
    
    // Define all categories for navigation pills
    const allCategories = [
      { id: 'all', name: 'All', icon: '🎮' },
      { id: 'currency', name: 'Currency', icon: '💰' },
      { id: 'accounts', name: 'Accounts', icon: '👤' },
      { id: 'giftcards', name: 'Gift Cards', icon: '🎁' },
      { id: 'items', name: 'Items', icon: '⚔️' },
      { id: 'boosting', name: 'Boosting', icon: '🚀' }
    ];
    
    const currentCategory = {
      id: categoryName,
      name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
      icon: categoryName.toLowerCase().includes('fifa') ? '⚽' : '🎯',
      count: listings.length
    };
    
    res.render('marketplace/category', { 
      title: currentCategory.name + ' — LEVEL UP',
      category: currentCategory,
      categories: allCategories,  // For navigation pills
      listings: listings, 
      user: req.session.user || null 
    });
  } catch (error) {
    console.error('Category error:', error);
    res.render('marketplace/category', { 
      title: 'Category — LEVEL UP',
      category: { id: 'all', name: 'Category', icon: '🎮', count: 0 },
      categories: [],
      listings: [], 
      user: req.session.user || null 
    });
  }
};

// Single listing view
exports.listing = async (req, res) => {
  try {
    const offer = await getOfferById(parseInt(req.params.id));
    if (!offer) {
      req.flash('error', 'Listing not found');
      return res.redirect('/marketplace');
    }
    
    const listing = {
      id: offer.id,
      title: offer.product_name || offer.service_name,
      price: offer.price,
      description: offer.description,
      stock: offer.stock,
      sellerName: offer.seller_name || 'Seller',
      delivery_time: '24 hours',
      tags: ['instant', 'safe', 'verified']
    };
    
    // Add seller object for template
    const seller = {
      id: offer.user_id,
      username: offer.seller_name || 'Seller',
      rating: 4.5,
      total_sales: 0,
      member_since: new Date().toISOString().split('T')[0]
    };
    
    res.render('marketplace/listing', { 
      title: listing.title + ' — LEVEL UP', 
      listing: listing,
      seller: seller,  // Required for template
      user: req.session.user || null 
    });
  } catch (error) {
    console.error('Listing error:', error);
    req.flash('error', 'Error loading listing');
    res.redirect('/marketplace');
  }
};

// Seller profile
exports.sellerProfile = async (req, res) => {
  try {
    const sellerId = parseInt(req.params.id);
    const offers = await getOffersBySeller(sellerId) || [];
    
    const listings = offers.map(offer => ({
      id: offer.id,
      title: offer.product_name || offer.service_name,
      price: offer.price,
      description: offer.description,
      sellerName: offer.seller_name || 'Seller'
    }));
    
    const seller = {
      id: sellerId,
      username: offers[0]?.seller_name || 'Seller',
      total_offers: listings.length,
      rating: 4.5,
      member_since: new Date().toISOString().split('T')[0]
    };
    
    res.render('marketplace/seller-profile', { 
      title: seller.username + ' — Seller Profile',
      seller: seller, 
      listings: listings, 
      user: req.session.user || null 
    });
  } catch (error) {
    console.error('Seller profile error:', error);
    res.render('marketplace/seller-profile', { 
      title: 'Seller Profile — LEVEL UP',
      seller: { username: 'Seller', total_offers: 0 }, 
      listings: [], 
      user: req.session.user || null 
    });
  }
};