const { getOrdersByBuyer, getWalletByUserId, getOfferById } = require('../models/data');

exports.dashboard = async (req, res) => {
  try {
    const orders = await getOrdersByBuyer(req.session.user.id) || [];
    console.log("orders", orders);
    const active = orders.filter(o => !o.is_paid);
    const completed = orders.filter(o => o.is_paid);
    
    res.render('buyer/dashboard', {
      title: 'Buyer Dashboard',
      orders,
      active,
      completed,
      user: req.session.user
    });
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
};

exports.wallet = async (req, res) => {
  try {
    const wallet = await getWalletByUserId(req.session.user.id) || { balance: 0 };
    console.log("DBG::wallet",wallet);
    res.render('buyer/wallet', { title: 'My Wallet', wallet,query:{search:''}, user: req.session.user || null ,transactions:[]});
  } catch (error) {
    res.render('buyer/wallet', { title: 'My Wallet', wallet: { balance: 0 },query:{search:''}, user: req.session.user || null , transactions:[]});
  }
};


exports.getOrders = async (req, res) => {
  try {
    const orders = await getOrdersByBuyer(req.session.user.id) || [];
    res.render('buyer/active-orders', { title: 'Orders', orders, user: req.session.user });
  } catch (error) {
    res.render('buyer/active-orders', { title: 'Orders', orders: [], user: req.session.user });
  }
};

exports.disputes = (req, res) => {
  res.render('buyer/disputes', { title: 'Disputes', disputes: [], user: req.session.user });
};

exports.notifications = (req, res) => {
  res.render('buyer/notifications', { title: 'Notifications', notifications: [], user: req.session.user });
};

exports.reviews = (req, res) => {
  res.render('buyer/reviews', { title: 'My Reviews', reviews: [], user: req.session.user });
};

exports.checkout = async (req, res) => {
  try {
    const offer = await getOfferById(parseInt(req.params.id));
    if (!offer) return res.redirect('/marketplace');
    
    res.render('buyer/checkout', {
      title: 'Checkout',
      listing: {
        id: offer.id,
        title: offer.product_name || offer.service_name,
        price: offer.price,
        sellerName: offer.seller_name
      },
      user: req.session.user
    });
  } catch (error) {
    res.redirect('/marketplace');
  }
};

exports.placeOrder = async (req, res) => {
  const { createOrder, markOrderAsPaid } = require('../models/data');
  try {
    const { offerId, total_price } = req.body;
    const orderId = await createOrder(req.session.user.id, offerId, total_price);
    await markOrderAsPaid(orderId);
    req.flash('success', 'Order placed successfully!');
    res.redirect('/buyer/orders');
  } catch (error) {
    req.flash('error', 'Order failed');
    res.redirect('/marketplace');
  }
};