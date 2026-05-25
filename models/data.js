const db = require('./db');

const users = [
  {
    id: 1, username: 'Ahmed_Pro', email: 'ahmed@example.com',
    password: '$2a$10$xyz', role: 'seller', verified: true,
    avatar: null, joinDate: '2023-01-15', balance: 4500,
    rating: 4.9, totalSales: 312, badge: 'premium',
    bio: 'Professional game currency seller. Fast delivery guaranteed.'
  },
  {
    id: 2, username: 'GameHunter', email: 'hunter@example.com',
    password: '$2a$10$xyz', role: 'buyer', verified: false,
    avatar: null, joinDate: '2023-06-20', balance: 1200,
    rating: 4.5, totalSales: 0, badge: null, bio: ''
},
  {
    id: 3, username: 'admin', email: 'admin@levelup.gg',
    password: '$2a$10$xyz', role: 'admin', verified: true,
    avatar: null, joinDate: '2022-01-01', balance: 0,
    rating: 5.0, totalSales: 0, badge: 'admin', bio: 'Platform Administrator'
  }
];


const listings = [
  {
    id: 1, sellerId: 1, sellerName: 'Ahmed_Pro', sellerRating: 4.9, sellerBadge: 'premium',
    category: 'currency', game: 'Free Fire', title: '10,000 Free Fire Diamonds',
    description: 'Instant delivery. Safe & secure. Tested daily. Best price in Egypt.',
    price: 450, currency: 'EGP', image: null,
    tags: ['instant', 'safe', 'cheapest'], views: 1240, sales: 89,
    stock: 50, status: 'active', featured: true, createdAt: '2024-01-10',
    deliveryTime: '5 min', minOrder: 1, maxOrder: 10
  },
  {
    id: 2, sellerId: 1, sellerName: 'Ahmed_Pro', sellerRating: 4.9, sellerBadge: 'premium',
    category: 'currency', game: 'PUBG Mobile', title: '600 UC PUBG Mobile',
    description: 'Fast delivery within minutes. Guaranteed safe.',
    price: 180, currency: 'EGP', image: null,
    tags: ['fast', 'safe'], views: 890, sales: 134,
    stock: 100, status: 'active', featured: true, createdAt: '2024-01-12',
    deliveryTime: '10 min', minOrder: 1, maxOrder: 20
  },
  {
    id: 3, sellerId: 1, sellerName: 'Ahmed_Pro', sellerRating: 4.9, sellerBadge: 'premium',
    category: 'accounts', game: 'Valorant', title: 'Valorant Gold Account - 30 Skins',
    description: 'Ready to play Gold ranked account with rare skins. Full access guaranteed.',
    price: 1200, currency: 'EGP', image: null,
    tags: ['rare', 'ranked', 'skins'], views: 456, sales: 12,
    stock: 3, status: 'active', featured: false, createdAt: '2024-01-20',
    deliveryTime: '30 min', minOrder: 1, maxOrder: 1
  },
  {
    id: 4, sellerId: 1, sellerName: 'Ahmed_Pro', sellerRating: 4.9, sellerBadge: 'premium',
    category: 'giftcards', game: 'PlayStation', title: 'PlayStation Store $20 Gift Card',
    description: 'Original PlayStation gift card. Works worldwide. Instant code delivery.',
    price: 680, currency: 'EGP', image: null,
    tags: ['instant', 'original'], views: 780, sales: 45,
    stock: 25, status: 'active', featured: true, createdAt: '2024-01-05',
    deliveryTime: 'Instant', minOrder: 1, maxOrder: 5
  },
  {
    id: 5, sellerId: 1, sellerName: 'Ahmed_Pro', sellerRating: 4.9, sellerBadge: 'premium',
    category: 'boosting', game: 'League of Legends', title: 'LOL Diamond Boosting',
    description: 'Professional boosting by Diamond+ players. VPN used for safety. Offline mode.',
    price: 2500, currency: 'EGP', image: null,
    tags: ['professional', 'safe', 'fast'], views: 320, sales: 8,
    stock: 10, status: 'active', featured: false, createdAt: '2024-01-18',
    deliveryTime: '1-3 days', minOrder: 1, maxOrder: 1
  },
  {
    id: 6, sellerId: 1, sellerName: 'Ahmed_Pro', sellerRating: 4.9, sellerBadge: 'premium',
    category: 'items', game: 'CS2', title: 'AK-47 Redline FT + M4 Desolate Space',
    description: 'Both skins bundled. Field-Tested condition. Trade via Steam.',
    price: 950, currency: 'EGP', image: null,
    tags: ['bundle', 'ft'], views: 590, sales: 6,
    stock: 1, status: 'active', featured: false, createdAt: '2024-01-22',
    deliveryTime: '1 hour', minOrder: 1, maxOrder: 1
  },
  {
    id: 7, sellerId: 1, sellerName: 'Ahmed_Pro', sellerRating: 4.9, sellerBadge: 'premium',
    category: 'topups', game: 'Clash of Clans', title: 'Clash of Clans 14,000 Gems',
    description: 'Direct account top-up. Share your player tag. Safe guaranteed.',
    price: 320, currency: 'EGP', image: null,
    tags: ['direct', 'safe'], views: 670, sales: 56,
    stock: 30, status: 'active', featured: true, createdAt: '2024-01-08',
    deliveryTime: '15 min', minOrder: 1, maxOrder: 5
  },
  {
    id: 8, sellerId: 1, sellerName: 'Ahmed_Pro', sellerRating: 4.9, sellerBadge: 'premium',
    category: 'giftcards', game: 'Steam', title: 'Steam Wallet $50 Gift Card',
    description: 'Instant delivery. Works on Egyptian accounts. No region lock.',
    price: 1650, currency: 'EGP', image: null,
    tags: ['instant', 'no-region-lock'], views: 920, sales: 72,
    stock: 15, status: 'active', featured: true, createdAt: '2024-01-03',
    deliveryTime: 'Instant', minOrder: 1, maxOrder: 3
  }
];


const orders = [
  {
    id: 'ORD-001', buyerId: 2, sellerId: 1, listingId: 1,
    title: '10,000 Free Fire Diamonds', amount: 450, status: 'completed',
    escrowStatus: 'released', createdAt: '2024-01-25', completedAt: '2024-01-25',
    buyerConfirmed: true, sellerDelivered: true, dispute: false
  },
  {
    id: 'ORD-002', buyerId: 2, sellerId: 1, listingId: 4,
    title: 'PlayStation Store $20 Gift Card', amount: 680, status: 'in_progress',
    escrowStatus: 'held', createdAt: '2024-01-28', completedAt: null,
    buyerConfirmed: false, sellerDelivered: true, dispute: false
  },
  {
    id: 'ORD-003', buyerId: 2, sellerId: 1, listingId: 2,
    title: '600 UC PUBG Mobile', amount: 180, status: 'disputed',
    escrowStatus: 'held', createdAt: '2024-01-20', completedAt: null,
    buyerConfirmed: false, sellerDelivered: false, dispute: true
  }
];


const disputes = [
  { id: 1, orderId: 'ORD-003', buyerId: 2, sellerId: 1, reason: 'Item not delivered as described', status: 'open', createdAt: '2024-01-21', evidence: 'Screenshots attached' }
];



// ============================================================
// USERS
// ============================================================
async function getAllUsers() {
  const [rows] = await db.query('SELECT id, email, username, role, is_verified, is_blocked, created_at FROM users ORDER BY created_at DESC');
  return rows;
}

async function getUserById(id) {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function getUserByEmail(email) {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function getUserByUsername(username) {
  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0] || null;
}

async function createUser({ username, email, password, role = 'buyer' }) {
  const [result] = await db.query(
    'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    [username, email, password, role]
  );
  return result.insertId;
}

async function updateUser(userId, fields) {
  const allowedFields = ['email', 'username', 'password', 'role', 'is_verified', 'is_blocked'];
  const updates = [];
  const values = [];
  
  for (const [key, value] of Object.entries(fields)) {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  }
  
  if (updates.length === 0) return;
  
  values.push(userId);
  await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
}

// ============================================================
// SELLERS
// ============================================================
async function getSellerByUserId(userId) {
  const [rows] = await db.query(
    `SELECT s.*, u.username, u.email, u.role, u.is_verified 
     FROM sellers s 
     JOIN users u ON u.id = s.user_id 
     WHERE s.user_id = ?`,
    [userId]
  );
  return rows[0] || null;
}

async function getSellerIdByOrder(orderId) {
  const [rows] = await db.query(
    `SELECT user_id 
     FROM offers  
     WHERE id = (SELECT offer_id FROM orders WHERE id = ?)`,
    [orderId]
  );
  console.log("DBG::sellerId = ",rows[0]);
  return rows[0] || null;
} 

async function getSellerById(sellerId) {
  const [rows] = await db.query(
    `SELECT s.*, u.username, u.email, u.role, u.is_verified 
     FROM sellers s 
     JOIN users u ON u.id = s.user_id 
     WHERE s.id = ?`,
    [sellerId]
  );
  return rows[0] || null;
}

async function createSeller(userId, sellerData) {
  const { f_name, l_name, dob, nationality, address, city, country, national_id_number, national_id_front_img, national_id_back_img, selfie_holding_id_img } = sellerData;
  const [result] = await db.query(
    `INSERT INTO sellers (user_id, f_name, l_name, dob, nationality, address, city, country, 
     national_id_number, national_id_front_img, national_id_back_img, selfie_holding_id_img) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, f_name, l_name, dob, nationality, address, city, country, 
     national_id_number, national_id_front_img, national_id_back_img, selfie_holding_id_img]
  );
  return result.insertId;
}

// ============================================================
// PRODUCTS & SERVICES
// ============================================================
async function getAllProducts() {
  const [rows] = await db.query(
    `SELECT p.*, u.username as seller_name 
     FROM products p 
     JOIN users u ON u.id = p.user_id`
  );
  return rows;
}

async function getProductById(id) {
  const [rows] = await db.query(
    `SELECT p.*, u.username as seller_name 
     FROM products p 
     JOIN users u ON u.id = p.user_id 
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function createProduct(userId, { name, image, description }) {
  const [result] = await db.query(
    'INSERT INTO products (name, image, description, user_id) VALUES (?, ?, ?, ?)',
    [name, image, description, userId]
  );
  return result.insertId;
}

async function getAllServices() {
  const [rows] = await db.query('SELECT * FROM services');
  return rows;
}

async function getServiceById(id) {
  const [rows] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
  return rows[0] || null;
}

// ============================================================
// OFFERS
// ============================================================

const reviews = [
  { id: 1, orderId: 'ORD-001', buyerId: 2, sellerId: 1, rating: 5, comment: 'Super fast delivery! Highly recommended seller. Will buy again.', createdAt: '2024-01-25' },
  { id: 2, orderId: null, buyerId: null, sellerId: 1, rating: 5, comment: 'Best FF diamonds seller in Egypt. Always instant delivery!', createdAt: '2024-01-22' },
  { id: 3, orderId: null, buyerId: null, sellerId: 1, rating: 4, comment: 'Good service, slight delay but resolved quickly.', createdAt: '2024-01-18' }
];
async function getAllOffers() {
  const [rows] = await db.query(
    `SELECT o.*, p.name as product_name, s.name as service_name, u.username as seller_name, p.image as product_image
     FROM offers o
     JOIN products p ON p.id = o.product_id
     JOIN services s ON s.id = o.service_id
     JOIN users u ON u.id = o.user_id`
  );
  return rows;
}

async function getOfferById(id) {
  const [rows] = await db.query(
    `SELECT o.*, p.name as product_name, s.name as service_name, u.username as seller_name, p.image as product_image
     FROM offers o
     JOIN products p ON p.id = o.product_id
     JOIN services s ON s.id = o.service_id
     JOIN users u ON u.id = o.user_id
     WHERE o.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function getOffersBySeller(userId) {
  const [rows] = await db.query(
    `SELECT o.*, p.name as product_name, s.name as service_name
     FROM offers o
     JOIN products p ON p.id = o.product_id
     JOIN services s ON s.id = o.service_id
     WHERE o.user_id = ?`,
    [userId]
  );
  return rows;
}

async function createOffer(sellerId, { price, description, stock, product_id, service_id }) {
  const [result] = await db.query(
    'INSERT INTO offers (price, description, stock, product_id, user_id, service_id) VALUES (?, ?, ?, ?, ?, ?)',
    [price, description, stock, product_id, sellerId, service_id]
  );
  return result.insertId;
}

// ============================================================
// ORDERS
// ============================================================
async function getOrdersByBuyer(userId) {
  const [rows] = await db.query(
    `SELECT o.*, off.price as offer_price, off.description as offer_description,
            p.name as product_name, s.name as service_name,
            e.status as escrow_status
     FROM orders o
     JOIN offers off ON off.id = o.offer_id
     JOIN products p ON p.id = off.product_id
     JOIN services s ON s.id = off.service_id
     LEFT JOIN escrow e ON e.order_id = o.id
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return rows;
}

async function getOrdersBySeller(sellerId) {
  const [rows] = await db.query(
    `SELECT o.*, u.username as buyer_name, off.price as offer_price, p.name as product_name
     FROM orders o
     JOIN offers off ON off.id = o.offer_id
     JOIN users u ON u.id = o.user_id
     JOIN products p ON p.id = off.product_id
     WHERE off.user_id = ?
     ORDER BY o.created_at DESC`,
    [sellerId]
  );
  return rows;
}

async function getOrderById(orderId) {
  const [rows] = await db.query(
    `SELECT o.*, off.price as offer_price, off.description as offer_description,
            p.name as product_name, s.name as service_name
     FROM orders o
     JOIN offers off ON off.id = o.offer_id
     JOIN products p ON p.id = off.product_id
     JOIN services s ON s.id = off.service_id
     WHERE o.id = ?`,
    [orderId]
  );
  return rows[0] || null;
}

async function createOrder(userId, offerId, total_price) {
  const [result] = await db.query(
    'INSERT INTO orders (user_id, offer_id, total_price,user_review,is_paid) VALUES (?, ?, ?, ?, ?)',
    [userId, offerId, total_price,"", 0]
  );
  return result.insertId;
}

async function markOrderAsPaid(orderId) {
  await db.query('UPDATE orders SET is_paid = 1 WHERE id = ?', [orderId]);
}

// ============================================================
// ESCROW
// ============================================================
async function getEscrowByOrderId(orderId) {
  const [rows] = await db.query('SELECT * FROM escrow WHERE order_id = ?', [orderId]);
  return rows[0] || null;
}

async function createEscrow(orderId, amount) {
  const [result] = await db.query(
    'INSERT INTO escrow (order_id, amount, status) VALUES (?, ?, ?)',
    [orderId, amount, 'pending']
  );
  return result.insertId;
}

async function releaseEscrow(orderId) {
  await db.query(
    'UPDATE escrow SET status = "released", released_at = NOW() WHERE order_id = ?',
    [orderId]
  );
}

// ============================================================
// WALLET
// ============================================================
async function getWalletByUserId(userId) {
  const [rows] = await db.query('SELECT * FROM wallet WHERE user_id = ?', [userId]);
  return rows[0] || null;
}

async function createWallet(userId) {
  const [result] = await db.query(
    'INSERT INTO wallet (user_id, balance, currency, afflieate_earn_amount) VALUES (?, ?, ?, ?)',
    [userId, 0.00, 'USD', 0]
  );
  return result.insertId;
}

async function updateWalletBalance(userId, newBalance) {
  await db.query('UPDATE wallet SET balance = ? WHERE user_id = ?', [newBalance, userId]);
}

// ============================================================
// SELLER GOALS
// ============================================================
async function getSellerGoals(sellerId) {
  const [rows] = await db.query(
    'SELECT * FROM sellers_goal WHERE seller_id = ? ORDER BY created_at DESC',
    [sellerId]
  );
  return rows;
}

async function createSellerGoal(sellerId, { goal_type, target_count, duration_days, start_date, end_date }) {
  const [result] = await db.query(
    `INSERT INTO sellers_goal (seller_id, goal_type, target_count, duration_days, start_date, end_date) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [sellerId, goal_type, target_count, duration_days, start_date, end_date]
  );
  return result.insertId;
}

// ============================================================
// DISPUTES & NOTIFICATIONS (NEW)
// ============================================================
async function getDisputesByBuyer(buyerId) {
  try {
    const [rows] = await db.query(
      `SELECT * from disputes where user_id = ?`,
      [buyerId]
    );
    return rows || [];
  } catch (error) {
    console.log('Disputes table not ready:', error.message);
    return [];
  }
}

async function postDisput(userId, orderId, description) {
  await db.query('INSERT INTO disputes (order_id,description,status,user_id) values (?,?,?,?)', [orderId,description,false,userId])
  const [rows] = await db.query("select * from disputes where user_id = ? ", [userId]);
  return rows || []; 
}
async function getNotificationsByUser(userId) {
  try {
    const [rows] = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );
    return rows || [];
  } catch (error) {
    console.log('Notifications table not ready:', error.message);
    return [];
  }
}

async function createNotification(userId, type, message) {
  try {
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
      [userId, type, message]
    );
    return result.insertId;
  } catch (error) {
    console.log('Failed to create notification:', error.message);
    return null;
  }
}

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  // Users
  users,listings,orders,disputes,
  getAllUsers, getUserById, getUserByEmail, getUserByUsername,
  createUser, updateUser,
  
  // Sellers
  getSellerByUserId, getSellerById, createSeller,getSellerIdByOrder,
  
  // Products & Services
  getAllProducts, getProductById, createProduct,
  getAllServices, getServiceById,
  
  // Offers
  getAllOffers, getOfferById, getOffersBySeller, createOffer, reviews,
  
  // Orders
  getOrdersByBuyer, getOrdersBySeller, getOrderById,
  createOrder, markOrderAsPaid,
  
  // Escrow
  getEscrowByOrderId, createEscrow, releaseEscrow,
  
  // Wallet
  getWalletByUserId, createWallet, updateWalletBalance,
  
  // Seller Goals
  getSellerGoals, createSellerGoal,
  
  // Disputes & Notifications (NEW)
  postDisput,
  getDisputesByBuyer,
  getNotificationsByUser,
  createNotification
};