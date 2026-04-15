const { getAllOffers, getAllServices, getAllUsers } = require('../models/data');

exports.home = async (req, res) => {
  try {
    let offers = await getAllOffers() || [];
    let services = await getAllServices() || [];
    let allUsers = await getAllUsers() || [];
    
    // Transform offers to match template expectations
    const featured = offers.slice(0, 6).map(offer => ({
      id: offer.id,
      title: offer.product_name || offer.service_name,
      price: offer.price,
      description: offer.description,
      image: offer.image || null,
      category: offer.service_name?.toLowerCase() || 'game',
      sellerName: offer.seller_name || 'Seller',
      rating: 4.5,
      sales: offer.stock || 0
    }));
    
    // Recent listings (last 4)
    const recent = [...offers].reverse().slice(0, 4).map(offer => ({
      id: offer.id,
      title: offer.product_name || offer.service_name,
      price: offer.price,
      sellerName: offer.seller_name || 'Seller',
      category: offer.service_name?.toLowerCase() || 'game'
    }));
    
    // Top sellers (from users table)
    const topSellers = allUsers
      .filter(u => u.role === 'seller')
      .slice(0, 4)
      .map(seller => ({
        id: seller.id,
        username: seller.username,
        rating: 4.5,
        sales: 0,
        avatar: null
      }));
    
    // Categories with counts (for the template)
    const categories = [
      { 
        id: 'all', 
        name: 'All', 
        icon: '🎮',
        count: offers.length  // Add count property
      },
      ...services.map(s => ({
        id: s.name.toLowerCase(),
        name: s.name,
        icon: s.name.includes('FIFA') ? '⚽' : '🎯',
        count: offers.filter(o => o.service_id === s.id).length  // Add count property
      }))
    ];
    
    res.render('index', {
      title: 'LEVEL UP — Gaming Marketplace Egypt',
      categories: categories,
      featured: featured,
      recent: recent,
      topSellers: topSellers,
      user: req.session.user || null
    });
    
  } catch (error) {
    console.error('Home error:', error);
    res.render('index', {
      title: 'LEVEL UP — Gaming Marketplace Egypt',
      categories: [],
      featured: [],
      recent: [],
      topSellers: [],
      user: req.session.user || null
    });
  }
};