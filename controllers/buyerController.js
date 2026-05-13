const { getOrdersByBuyer, getWalletByUserId, getOfferById, postDisput, getDisputesByBuyer } = require('../models/data');

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

exports.disputes = async (req, res) => {
  const disputes = await getDisputesByBuyer(req.session.user.id);
  console.log("DBG::disputes",disputes);
  res.render('buyer/disputes', { title: 'Disputes', disputes, user: req.session.user });
};

exports.postDispute = async (req, res) => {
  const {orderId, description} = req.body;
  const disputes = await postDisput(req.session.user.id,orderId,description);
  res.render('buyer/disputes', { title: 'Disputes', disputes, user: req.session.user });
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
    const quantity = req.query.q || 1;
    
    res.render('buyer/checkout', {
      title: 'Checkout',
      listing: {
        id: offer.id,
        title: offer.product_name || offer.service_name,
        price: offer.price * quantity,
        sellerName: offer.seller_name
      },
      user: req.session.user
    });
  } catch (error) {
    res.redirect('/marketplace');
  }
};

exports.placeOrder = async (req, res) => {
  const { createOrder, createEscrow } = require('../models/data');
  try {
    const { offerId, total_price } = req.body;

    // Create order with is_paid = 0 (unpaid until admin releases escrow)
    const orderId = await createOrder(req.session.user.id, offerId, total_price);

    // Create escrow row with status = 'pending'
    await createEscrow(orderId, total_price);

    req.flash('success', '✅ Order placed! Funds held in escrow until delivery is confirmed.');
    res.redirect('/buyer/orders');
  } catch (error) {
    console.error('Place order error:', error);
    req.flash('error', 'Order failed. Please try again.');
    res.redirect('/marketplace');
  }
};