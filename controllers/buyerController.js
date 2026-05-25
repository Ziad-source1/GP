const { getOrdersByBuyer, getWalletByUserId, getOfferById, postDisput, getDisputesByBuyer,getSellerIdByOrder } = require('../models/data');

const db = require('../models/db');

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

exports.completeOrders = async (req, res) => {
  try {
    const orderId = req.params.order_id;

    // Check if escrow row exists
    const [[existing]] = await db.query(
      `SELECT id FROM escrow WHERE order_id = ?`, [orderId]
    );

    if (existing) {
      await db.query(
        `UPDATE escrow SET status = 'released', released_at = NOW() WHERE order_id = ?`,
        [orderId]
      );
    } else {
      const [[order]] = await db.query(
        `SELECT total_price FROM orders WHERE id = ?`, [orderId]
      );
      await db.query(
        `INSERT INTO escrow (order_id, amount, status, released_at) VALUES (?, ?, 'released', NOW())`,
        [orderId, order.total_price]
      );
    }

    const [[order]] = await db.query(
      'SELECT * from orders where id = ? ', [orderId]
    )

    console.log("DBG::order",order);
    
    // subtract buyer wallet
    // const buyerId = order.user_id;
    const buyerId = req.session.user.id;
    const [[{balance: buyerBalance}]] = await db.query('SELECT balance from wallet where user_id = ? ',[buyerId]);
    console.log("DBG::buyerBalance ", buyerBalance )
    const newBuyerBalance = Number(buyerBalance) - Number(order.total_price);
    await db.query(`UPDATE wallet SET balance = ? WHERE user_id = ?`, [newBuyerBalance, buyerId]);
    
    // add to seller wallet
    // const sellerId = req.session.user.id;
    const {user_id:sellerId} = await getSellerIdByOrder(orderId);
    const [[{plan}]] = await db.query('SELECT plan from users where id = ?' , [sellerId]);
    console.log("DBG::seller_id from controller = ",sellerId);
    const [[{balance: sellerBalance}]] = await db.query('SELECT balance from wallet where user_id = ?' , [sellerId]);
    const total_price = Number(order.total_price);
    // const plan = Number(req.session.user.plan)
    console.log("DBG::commission_rate plan ", plan);
    const commission_rate = plan === 0 ? 0.1 : plan === 1 ? 0.07 : 0.04;
    const commission = total_price * commission_rate;
    console.log("DBG::commission ", commission);
    const newSellerBalance = Number(sellerBalance) + total_price - commission;
    console.log("DBG::newsellerBalance " , newSellerBalance);
    req.session.user.balance = newSellerBalance;
    await db.query(`UPDATE wallet SET balance = ? WHERE user_id = ?`, [newSellerBalance, sellerId]);
    
    const [[{balance: adminBalance}]] = await db.query('SELECT balance from wallet where user_id = 179 ');
    const new_balance = Number(adminBalance) + commission;
    await db.query(`UPDATE wallet SET balance = ? WHERE user_id = 179`,[new_balance]);

    await db.query(`UPDATE orders SET is_paid = 1 WHERE id = ?`, [orderId]);
    req.flash('success', `✅ Order #${orderId} marked as complete.`);
  } catch (err) {
    console.error('Complete order error:', err);
    req.flash('error', '❌ Failed to complete order.');
  }
  res.redirect('/buyer/orders');
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