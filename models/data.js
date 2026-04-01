// ============================================================
// LEVEL UP — Database Query Layer  (replaces mock data)
// All async functions — use await in controllers
// ============================================================
const db = require('../db');

// ── Static data (no DB table needed) ────────────────────────
const categories = [
  { id: 'currency',  name: 'Game Currency', icon: '💰', count: 0, color: '#00FF88' },
  { id: 'accounts',  name: 'Game Accounts', icon: '🎮', count: 0, color: '#D4AF37' },
  { id: 'topups',    name: 'Top-Ups',        icon: '⚡', count: 0, color: '#00CFFF' },
  { id: 'items',     name: 'In-Game Items',  icon: '⚔️', count: 0, color: '#FF6B6B' },
  { id: 'boosting',  name: 'Boosting',       icon: '🚀', count: 0, color: '#A855F7' },
  { id: 'giftcards', name: 'Gift Cards',     icon: '🎁', count: 0, color: '#F59E0B' }
];

const premiumPlans = [
  { id:'basic',  name:'Basic',  price:0,   commission:10, features:['Standard listing','Basic analytics','5 active listings'] },
  { id:'pro',    name:'Pro',    price:299,  commission:7,  features:['20 active listings','Featured slots','Advanced analytics','Priority support','Pro badge'] },
  { id:'elite',  name:'Elite',  price:699,  commission:4,  features:['Unlimited listings','Top featured','Full analytics','24/7 VIP support','Elite badge','Affiliate program'] }
];

const faqs = [
  { q:'How does escrow work?',              a:'When you buy, funds are locked. After seller delivers and you confirm, funds are released. Issues? Our team mediates.' },
  { q:'How do I become a verified seller?', a:'Upload your National ID in Seller Verification. Reviewed within 24 hours.' },
  { q:'What payment methods are accepted?', a:'Vodafone Cash, Fawry, bank cards, and our internal wallet.' },
  { q:'How long does verification take?',   a:'24–48 hours after document submission.' },
  { q:'What is the commission rate?',       a:'Basic 10%, Pro 7%, Elite 4%.' },
  { q:'Can I sell any game?',               a:'Yes! Contact support to add unlisted games.' },
  { q:'How do I report a scam?',            a:'Open a dispute from your order page with evidence.' },
  { q:'Is my data safe?',                   a:'Yes. Encrypted and never shared with third parties.' }
];

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────
function normaliseProduct(row) {
  return {
    id:           row.id,
    sellerId:     row.seller_db_id || row.seller_id,
    sellerUserId: row.seller_user_id || null,
    sellerName:   row.seller_name  || 'Unknown',
    sellerRating: parseFloat(row.seller_rating) || 0,
    sellerBadge:  row.seller_badge || null,
    category:     row.category,
    game:         row.game,
    title:        row.title,
    description:  row.description,
    price:        parseFloat(row.price),
    stock:        row.stock,
    minOrder:     row.min_order || 1,
    maxOrder:     row.max_order || 10,
    deliveryTime: row.delivery_time || '15 min',
    tags:         row.tags ? row.tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
    image:        row.image || null,
    featured:     !!row.featured,
    status:       row.status,
    views:        row.views || 0,
    sales:        row.sales || 0,
    createdAt:    row.created_at
  };
}

// ────────────────────────────────────────────────────────────
// USERS
// ────────────────────────────────────────────────────────────
async function getAllUsers() {
  const [rows] = await db.query('SELECT * FROM users ORDER BY created_at DESC');
  return rows;
}

async function getUserById(id) {
  const [rows] = await db.query('SELECT * FROM users WHERE id=?', [id]);
  return rows[0] || null;
}

async function getUserByEmail(email) {
  const [rows] = await db.query('SELECT * FROM users WHERE email=?', [email]);
  return rows[0] || null;
}

async function getUserByUsername(username) {
  const [rows] = await db.query('SELECT * FROM users WHERE username=?', [username]);
  return rows[0] || null;
}

async function createUser({ username, email, password, phone=null, role='buyer' }) {
  const [r] = await db.query(
    'INSERT INTO users (username,email,password,phone,role) VALUES (?,?,?,?,?)',
    [username, email, password, phone, role]);
  return r.insertId;
}

async function updateUser(userId, fields) {
  const cols = Object.keys(fields).map(k=>`${k}=?`).join(',');
  await db.query(`UPDATE users SET ${cols} WHERE id=?`, [...Object.values(fields), userId]);
}

async function updateUserBalance(userId, delta) {
  await db.query('UPDATE users SET balance=balance+? WHERE id=?', [delta, userId]);
}

// ────────────────────────────────────────────────────────────
// SELLERS
// ────────────────────────────────────────────────────────────
async function getSellerByUserId(userId) {
  const [rows] = await db.query(
    `SELECT s.*, u.username, u.email, u.rating, u.total_sales, u.balance,
            u.badge, u.bio, u.avatar, u.join_date, u.verified
     FROM sellers s JOIN users u ON u.id=s.user_id
     WHERE s.user_id=?`, [userId]);
  return rows[0] || null;
}

async function getSellerById(sellerId) {
  const [rows] = await db.query(
    `SELECT s.*, u.username, u.email, u.rating, u.total_sales, u.balance,
            u.badge, u.bio, u.avatar, u.join_date, u.verified
     FROM sellers s JOIN users u ON u.id=s.user_id
     WHERE s.id=?`, [sellerId]);
  return rows[0] || null;
}

async function getTopSellers(limit=4) {
  const [rows] = await db.query(
    `SELECT u.id, u.username, u.rating, u.total_sales, u.badge, u.bio, u.avatar
     FROM users u WHERE u.role='seller' AND u.verified=1
     ORDER BY u.total_sales DESC LIMIT ?`, [limit]);
  return rows;
}

async function createSeller(userId) {
  const [r] = await db.query('INSERT IGNORE INTO sellers (user_id) VALUES (?)', [userId]);
  return r.insertId;
}

async function updateSellerVerification(userId, data) {
  await db.query(
    `UPDATE sellers SET doc_type=?,full_name=?,id_number=?,doc_status='pending',submitted_at=NOW()
     WHERE user_id=?`,
    [data.docType, data.fullName, data.idNumber, userId]);
}

async function getPendingVerifications() {
  const [rows] = await db.query(
    `SELECT s.id, u.username, u.email, s.doc_type, s.submitted_at, s.doc_status
     FROM sellers s JOIN users u ON u.id=s.user_id
     WHERE s.doc_status='pending' ORDER BY s.submitted_at ASC`);
  return rows;
}

async function approveVerification(sellerId) {
  await db.query(`UPDATE sellers SET doc_status='approved',approved_at=NOW() WHERE id=?`, [sellerId]);
  const [rows] = await db.query('SELECT user_id FROM sellers WHERE id=?', [sellerId]);
  if (rows[0]) await db.query('UPDATE users SET verified=1 WHERE id=?', [rows[0].user_id]);
}

async function rejectVerification(sellerId) {
  await db.query(`UPDATE sellers SET doc_status='rejected' WHERE id=?`, [sellerId]);
}

// ────────────────────────────────────────────────────────────
// PRODUCTS / LISTINGS
// ────────────────────────────────────────────────────────────
async function getAllListings(filters={}) {
  let sql = `SELECT p.*, s.id AS seller_db_id, s.user_id AS seller_user_id,
             u.username AS seller_name, u.rating AS seller_rating, u.badge AS seller_badge
             FROM products p
             JOIN sellers s ON s.id=p.seller_id
             JOIN users u ON u.id=s.user_id
             WHERE p.status='active'`;
  const vals = [];
  if (filters.search) { sql += ' AND (p.title LIKE ? OR p.game LIKE ?)'; vals.push(`%${filters.search}%`,`%${filters.search}%`); }
  if (filters.category) { sql += ' AND p.category=?'; vals.push(filters.category); }
  if (filters.min) { sql += ' AND p.price>=?'; vals.push(Number(filters.min)); }
  if (filters.max) { sql += ' AND p.price<=?'; vals.push(Number(filters.max)); }
  const sortMap = { price_asc:'p.price ASC', price_desc:'p.price DESC', popular:'p.sales DESC' };
  sql += ' ORDER BY '+(sortMap[filters.sort]||'p.featured DESC, p.sales DESC');
  const [rows] = await db.query(sql, vals);
  return rows.map(normaliseProduct);
}

async function getFeaturedListings(limit=6) {
  const [rows] = await db.query(
    `SELECT p.*, s.id AS seller_db_id, s.user_id AS seller_user_id,
            u.username AS seller_name, u.rating AS seller_rating, u.badge AS seller_badge
     FROM products p JOIN sellers s ON s.id=p.seller_id JOIN users u ON u.id=s.user_id
     WHERE p.status='active' AND p.featured=1
     ORDER BY p.sales DESC LIMIT ?`, [limit]);
  return rows.map(normaliseProduct);
}

async function getListingById(id) {
  const [rows] = await db.query(
    `SELECT p.*, s.id AS seller_db_id, s.user_id AS seller_user_id,
            u.username AS seller_name, u.rating AS seller_rating, u.badge AS seller_badge,
            u.bio AS seller_bio, u.total_sales AS seller_total_sales, u.avatar AS seller_avatar
     FROM products p JOIN sellers s ON s.id=p.seller_id JOIN users u ON u.id=s.user_id
     WHERE p.id=?`, [id]);
  return rows[0] ? normaliseProduct(rows[0]) : null;
}

async function getListingsBySeller(sellerId, excludeId=null) {
  let sql = `SELECT p.*, s.id AS seller_db_id, u.username AS seller_name,
             u.rating AS seller_rating, u.badge AS seller_badge
             FROM products p JOIN sellers s ON s.id=p.seller_id JOIN users u ON u.id=s.user_id
             WHERE p.seller_id=? AND p.status='active'`;
  const vals = [sellerId];
  if (excludeId) { sql += ' AND p.id!=?'; vals.push(excludeId); }
  sql += ' LIMIT 4';
  const [rows] = await db.query(sql, vals);
  return rows.map(normaliseProduct);
}

async function getListingsBySellerUserId(userId) {
  const [rows] = await db.query(
    `SELECT p.*, s.id AS seller_db_id, u.username AS seller_name,
            u.rating AS seller_rating, u.badge AS seller_badge
     FROM products p JOIN sellers s ON s.id=p.seller_id JOIN users u ON u.id=s.user_id
     WHERE s.user_id=? ORDER BY p.created_at DESC`, [userId]);
  return rows.map(normaliseProduct);
}

async function createListing(sellerId, data) {
  const tags = Array.isArray(data.tags) ? data.tags.join(',') : (data.tags||'');
  const [r] = await db.query(
    `INSERT INTO products (seller_id,category,game,title,description,price,stock,min_order,max_order,delivery_time,tags)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [sellerId, data.category, data.game, data.title, data.description||'',
     data.price, data.stock||1, data.minOrder||1, data.maxOrder||10,
     data.deliveryTime||'15 min', tags]);
  return r.insertId;
}

async function getCategoriesWithCounts() {
  const result = [];
  for (const cat of categories) {
    const [[row]] = await db.query(
      "SELECT COUNT(*) AS cnt FROM products WHERE category=? AND status='active'", [cat.id]);
    result.push({ ...cat, count: row.cnt });
  }
  return result;
}

async function toggleFeatured(productId, state) {
  await db.query('UPDATE products SET featured=? WHERE id=?', [state?1:0, productId]);
}

// ────────────────────────────────────────────────────────────
// ORDERS
// ────────────────────────────────────────────────────────────
async function getOrdersByBuyer(buyerId) {
  const [rows] = await db.query(
    'SELECT * FROM orders WHERE buyer_id=? ORDER BY created_at DESC', [buyerId]);
  return rows;
}

async function getOrdersBySeller(sellerId) {
  const [rows] = await db.query(
    `SELECT o.*, u.username AS buyer_name FROM orders o
     JOIN users u ON u.id=o.buyer_id WHERE o.seller_id=?
     ORDER BY o.created_at DESC`, [sellerId]);
  return rows;
}

async function getOrderById(orderId) {
  const [rows] = await db.query('SELECT * FROM orders WHERE id=?', [orderId]);
  return rows[0] || null;
}

async function createOrder(data) {
  const orderId = 'ORD-' + Date.now().toString().slice(-6);
  await db.query(
    `INSERT INTO orders (id,buyer_id,seller_id,product_id,title,quantity,amount,payment_method,buyer_game_id,delivery_notes,status)
     VALUES (?,?,?,?,?,?,?,?,?,?,'in_progress')`,
    [orderId, data.buyerId, data.sellerId, data.productId, data.title,
     data.quantity||1, data.amount, data.paymentMethod||'wallet',
     data.buyerGameId||null, data.deliveryNotes||null]);

  const commission = parseFloat((data.amount * (data.commissionRate||10)/100).toFixed(2));
  await db.query(
    `INSERT INTO escrow (order_id,buyer_id,seller_id,amount,commission,net_amount)
     VALUES (?,?,?,?,?,?)`,
    [orderId, data.buyerId, data.sellerId, data.amount, commission,
     parseFloat((data.amount - commission).toFixed(2))]);

  await db.query('UPDATE users SET balance=balance-? WHERE id=?', [data.amount, data.buyerId]);
  await db.query(
    `INSERT INTO wallet (user_id,type,amount,method,note,ref_order) VALUES (?,'purchase',?,?,'Escrowed for order',?)`,
    [data.buyerId, -data.amount, data.paymentMethod||'wallet', orderId]);

  // notify seller
  await createNotification(data.sellerUserId || data.sellerId, 'sale',
    `New order ${orderId} for ${data.amount} EGP`);

  return orderId;
}

async function confirmDelivery(orderId, buyerId) {
  await db.query(
    `UPDATE orders SET buyer_confirmed=1,status='completed',escrow_status='released',completed_at=NOW()
     WHERE id=? AND buyer_id=?`, [orderId, buyerId]);
  const order = await getOrderById(orderId);
  if (order) {
    const [[esc]] = await db.query('SELECT * FROM escrow WHERE order_id=?', [orderId]);
    const net = esc ? esc.net_amount : order.amount;
    // credit seller
    await db.query(
      `UPDATE users SET balance=balance+?
       WHERE id=(SELECT user_id FROM sellers WHERE id=? LIMIT 1)`,
      [net, order.seller_id]);
    await db.query(`UPDATE escrow SET status='released',released_at=NOW() WHERE order_id=?`, [orderId]);
    await db.query(
      `INSERT INTO wallet (user_id,type,amount,method,note,ref_order)
       SELECT user_id,'sale',?,?,'Sale proceeds','?' FROM sellers WHERE id=?`,
      [net, 'wallet', orderId, order.seller_id]);
    // update seller total_sales
    await db.query(
      `UPDATE users SET total_sales=total_sales+1
       WHERE id=(SELECT user_id FROM sellers WHERE id=? LIMIT 1)`, [order.seller_id]);
  }
}

async function markDelivered(orderId, sellerId) {
  await db.query(
    `UPDATE orders SET seller_delivered=1 WHERE id=? AND seller_id=?`, [orderId, sellerId]);
}

// ────────────────────────────────────────────────────────────
// ESCROW
// ────────────────────────────────────────────────────────────
async function getAllEscrow() {
  const [rows] = await db.query(
    `SELECT e.*, o.title, o.buyer_confirmed, o.seller_delivered, o.status AS order_status
     FROM escrow e JOIN orders o ON o.id=e.order_id ORDER BY e.held_at DESC`);
  return rows;
}

// ────────────────────────────────────────────────────────────
// WALLET
// ────────────────────────────────────────────────────────────
async function getWalletByUser(userId) {
  const [rows] = await db.query(
    'SELECT * FROM wallet WHERE user_id=? ORDER BY created_at DESC', [userId]);
  return rows;
}

async function addDeposit(userId, amount, method) {
  await db.query('UPDATE users SET balance=balance+? WHERE id=?', [amount, userId]);
  await db.query(
    `INSERT INTO wallet (user_id,type,amount,method,note) VALUES (?,'deposit',?,?,'Wallet top-up')`,
    [userId, amount, method]);
}

// ────────────────────────────────────────────────────────────
// REVIEWS
// ────────────────────────────────────────────────────────────
async function getReviewsBySeller(sellerId) {
  const [rows] = await db.query(
    `SELECT r.*, u.username AS buyer_name FROM reviews r
     JOIN users u ON u.id=r.buyer_id WHERE r.seller_id=?
     ORDER BY r.created_at DESC`, [sellerId]);
  return rows;
}

async function createReview({ orderId, buyerId, sellerId, rating, comment }) {
  await db.query(
    'INSERT INTO reviews (order_id,buyer_id,seller_id,rating,comment) VALUES (?,?,?,?,?)',
    [orderId, buyerId, sellerId, rating, comment]);
  await db.query(
    `UPDATE users SET rating=(SELECT AVG(rating) FROM reviews WHERE seller_id=?)
     WHERE id=(SELECT user_id FROM sellers WHERE id=? LIMIT 1)`,
    [sellerId, sellerId]);
}

// ────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ────────────────────────────────────────────────────────────
async function getNotificationsByUser(userId) {
  const [rows] = await db.query(
    'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50', [userId]);
  return rows;
}

async function createNotification(userId, type, message) {
  await db.query('INSERT INTO notifications (user_id,type,message) VALUES (?,?,?)',
    [userId, type, message]);
}

async function markNotificationsRead(userId) {
  await db.query('UPDATE notifications SET read_flag=1 WHERE user_id=?', [userId]);
}

// ────────────────────────────────────────────────────────────
// DISPUTES
// ────────────────────────────────────────────────────────────
async function getDisputesByBuyer(buyerId) {
  const [rows] = await db.query(
    'SELECT * FROM disputes WHERE buyer_id=? ORDER BY created_at DESC', [buyerId]);
  return rows;
}

async function getAllDisputes() {
  const [rows] = await db.query(
    `SELECT d.*, ub.username AS buyer_name FROM disputes d
     JOIN users ub ON ub.id=d.buyer_id ORDER BY d.created_at DESC`);
  return rows;
}

async function createDispute({ orderId, buyerId, sellerId, reason, description='', evidence='' }) {
  await db.query(
    'INSERT INTO disputes (order_id,buyer_id,seller_id,reason,description,evidence) VALUES (?,?,?,?,?,?)',
    [orderId, buyerId, sellerId, reason, description, evidence]);
  await db.query('UPDATE orders SET dispute=1 WHERE id=?', [orderId]);
}

async function resolveDispute(disputeId, resolution, adminNote='') {
  const s = resolution==='buyer' ? 'resolved_buyer' : 'resolved_seller';
  await db.query(
    'UPDATE disputes SET status=?,admin_note=?,resolved_at=NOW() WHERE id=?',
    [s, adminNote, disputeId]);
}

// ────────────────────────────────────────────────────────────
// SELLER ANALYTICS
// ────────────────────────────────────────────────────────────
async function getSellerAnalytics(sellerId) {
  const [[rev]]   = await db.query(`SELECT COALESCE(SUM(net_amount),0) AS t FROM escrow WHERE seller_id=? AND status='released'`,[sellerId]);
  const [[month]] = await db.query(`SELECT COALESCE(SUM(net_amount),0) AS t FROM escrow WHERE seller_id=? AND status='released' AND MONTH(released_at)=MONTH(NOW()) AND YEAR(released_at)=YEAR(NOW())`,[sellerId]);
  const [[lastm]] = await db.query(`SELECT COALESCE(SUM(net_amount),0) AS t FROM escrow WHERE seller_id=? AND status='released' AND MONTH(released_at)=MONTH(NOW()-INTERVAL 1 MONTH) AND YEAR(released_at)=YEAR(NOW()-INTERVAL 1 MONTH)`,[sellerId]);
  const [[ords]]  = await db.query(`SELECT COUNT(*) AS cnt FROM orders WHERE seller_id=? AND status='completed'`,[sellerId]);
  const [[rate]]  = await db.query(`SELECT COALESCE(completion_rate,0) AS r FROM sellers WHERE id=?`,[sellerId]);

  const ym = new Date().toISOString().slice(0,7);
  const [[goal]] = await db.query(
    `SELECT * FROM sellers_goal WHERE seller_id=? AND month=?`,[sellerId,ym]);
  const g = goal || { revenue_target:10000,revenue_current:0,trades_target:50,trades_current:0,streak_current:0,streak_best:0,streak_weekly:0 };

  // 7-day bars
  const [rev7] = await db.query(
    `SELECT DATE(released_at) AS d, COALESCE(SUM(net_amount),0) AS t FROM escrow
     WHERE seller_id=? AND status='released' AND released_at>=NOW()-INTERVAL 7 DAY
     GROUP BY DATE(released_at)`,[sellerId]);
  const revenueChart = Array(7).fill(0);
  rev7.forEach(r => {
    const i = 6-Math.round((Date.now()-new Date(r.d))/86400000);
    if (i>=0 && i<7) revenueChart[i] = parseFloat(r.t);
  });

  const [ord7] = await db.query(
    `SELECT DATE(created_at) AS d, COUNT(*) AS cnt FROM orders
     WHERE seller_id=? AND created_at>=NOW()-INTERVAL 7 DAY
     GROUP BY DATE(created_at)`,[sellerId]);
  const ordersChart = Array(7).fill(0);
  ord7.forEach(r => {
    const i = 6-Math.round((Date.now()-new Date(r.d))/86400000);
    if (i>=0 && i<7) ordersChart[i] = parseInt(r.cnt);
  });

  // Top games
  const [topG] = await db.query(
    `SELECT p.game, COUNT(*) AS cnt FROM orders o
     JOIN products p ON p.id=o.product_id
     WHERE o.seller_id=? GROUP BY p.game ORDER BY cnt DESC LIMIT 3`,[sellerId]);
  const topGames = topG.length ? topG.map(r=>r.game) : ['Free Fire','PUBG Mobile','Clash of Clans'];

  return {
    totalRevenue:    parseFloat(rev.t)||0,
    thisMonth:       parseFloat(month.t)||0,
    lastMonth:       parseFloat(lastm.t)||0,
    totalOrders:     ords.cnt||0,
    completionRate:  parseFloat(rate.r)||0,
    avgResponseTime: '4 min',
    topGames,
    revenueChart,
    ordersChart,
    streak: { current:g.streak_current, best:g.streak_best, weekly:g.streak_weekly },
    goal:   { target:parseFloat(g.revenue_target), current:parseFloat(g.revenue_current),
              trades:{ target:g.trades_target, current:g.trades_current } }
  };
}

// ────────────────────────────────────────────────────────────
// AFFILIATES
// ────────────────────────────────────────────────────────────
async function getAffiliateByUser(userId) {
  const [rows] = await db.query('SELECT * FROM affiliates WHERE user_id=?',[userId]);
  return rows[0]||null;
}

async function createAffiliate(userId, code) {
  await db.query('INSERT IGNORE INTO affiliates (user_id,code) VALUES (?,?)',[userId,code]);
}

// ────────────────────────────────────────────────────────────
// ADMIN STATS
// ────────────────────────────────────────────────────────────
async function getAdminStats() {
  const [[u]]  = await db.query('SELECT COUNT(*) AS cnt FROM users');
  const [[s]]  = await db.query(`SELECT COUNT(*) AS cnt FROM sellers WHERE doc_status='approved'`);
  const [[l]]  = await db.query(`SELECT COUNT(*) AS cnt FROM products WHERE status='active'`);
  const [[o]]  = await db.query('SELECT COUNT(*) AS cnt FROM orders');
  const [[rev]]= await db.query(`SELECT COALESCE(SUM(commission),0) AS t FROM escrow WHERE status='released'`);
  const [[d]]  = await db.query(`SELECT COUNT(*) AS cnt FROM disputes WHERE status='open'`);
  const [[pv]] = await db.query(`SELECT COUNT(*) AS cnt FROM sellers WHERE doc_status='pending'`);
  return { users:u.cnt, sellers:s.cnt, listings:l.cnt, orders:o.cnt,
           revenue:parseFloat(rev.t)||0, disputes:d.cnt, pendingVerifications:pv.cnt };
}

async function getRecentOrders(limit=10) {
  const [rows] = await db.query(
    'SELECT * FROM orders ORDER BY created_at DESC LIMIT ?',[limit]);
  return rows;
}

// ────────────────────────────────────────────────────────────
// EXPORTS
// ────────────────────────────────────────────────────────────
module.exports = {
  categories, premiumPlans, faqs,
  getAllUsers, getUserById, getUserByEmail, getUserByUsername,
  createUser, updateUser, updateUserBalance,
  getSellerByUserId, getSellerById, getTopSellers, createSeller,
  updateSellerVerification, getPendingVerifications,
  approveVerification, rejectVerification,
  getAllListings, getFeaturedListings, getListingById,
  getListingsBySeller, getListingsBySellerUserId,
  createListing, getCategoriesWithCounts, toggleFeatured, normaliseProduct,
  getOrdersByBuyer, getOrdersBySeller, getOrderById,
  createOrder, confirmDelivery, markDelivered,
  getAllEscrow,
  getWalletByUser, addDeposit,
  getReviewsBySeller, createReview,
  getNotificationsByUser, createNotification, markNotificationsRead,
  getDisputesByBuyer, getAllDisputes, createDispute, resolveDispute,
  getSellerAnalytics,
  getAffiliateByUser, createAffiliate,
  getAdminStats, getRecentOrders
};