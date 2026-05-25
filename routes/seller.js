const express = require('express');
const router = express.Router();
const { requireLogin, requireSeller } = require('../models/middleware');
const { createSeller, updateUser, getSellerByUserId } = require('../models/data');
const db = require('../models/db');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/products/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// ============================================
// PUBLIC SELLER ROUTES (no seller status required)
// ============================================

router.get('/become-seller', requireLogin, (req, res) => {
  console.log("req.session.user.is_seller", req.session.user.is_seller);
  if (req.session.user.is_seller === 1 || req.session.user.role === 'seller') {
    return res.redirect('/seller/dashboard');
  }
  
  res.render('seller/become-seller', { 
    title: 'Become a Seller', 
    user: req.session.user,
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.post('/become-seller', requireLogin, async (req, res) => {
  try {
    const { firstName, lastName, dob, nationality, address, city, country, nationalId } = req.body;
    
    const existingSeller = await getSellerByUserId(req.session.user.id);
    if (existingSeller) {
      req.flash('error', 'You are already a seller or have a pending application');
      return res.redirect('/seller/dashboard');
    }
    
    const sellerData = {
      f_name: firstName,
      l_name: lastName,
      dob: dob,
      nationality: nationality,
      address: address,
      city: city,
      country: country,
      national_id_number: nationalId,
      national_id_front_img: 'pending.jpg',
      national_id_back_img: 'pending.jpg',
      selfie_holding_id_img: 'pending.jpg'
    };
    
    await createSeller(req.session.user.id, sellerData);
    await updateUser(req.session.user.id, { is_seller: 1 });
    
    req.session.user.is_seller = 1;
    
    req.flash('success', 'Seller application submitted! Awaiting verification.');
    res.redirect('/seller/dashboard');
  } catch (error) {
    console.error('Seller registration error:', error);
    req.flash('error', 'Failed to submit seller application');
    res.redirect('/seller/become-seller');
  }
});

router.post('/upgrade_plane/:planId', requireLogin, async (req, res) => {
  const plan_id = req.params.planId
  req.session.user.plane = plan_id;
  await db.query('UPDATE users SET plan = ?  WHERE id = ? ', [plan_id,req.session.user.id]);
  res.redirect('/seller/dashboard');

});

router.get('/premium', requireLogin, (req, res) => {
  const plans = [
    { name: 'Basic', price: 0, commission: 10, features: ['5 Active Listings', 'Basic Analytics', 'Standard Support'], popular: false },
    { name: 'Pro', price: 299, commission: 7, features: ['50 Active Listings', 'Advanced Analytics', 'Priority Support', 'Featured Listings'], popular: true },
    { name: 'Elite', price: 699, commission: 4, features: ['Unlimited Listings', 'Full Analytics', 'VIP Support', 'Top Featured', 'Affiliate Program'], popular: false }
  ];
  
  res.render('seller/premium', { 
    title: 'Upgrade to Premium', 
    plans: plans,
    user: req.session.user 
  });
});

// Verification Status
// Multer config for verification documents
const verificationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/verification/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const verificationUpload = multer({
  storage: verificationStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only JPG, PNG or PDF files are allowed'));
  }
});

// GET /seller/verification
router.get('/verification', requireLogin, async (req, res) => {
  try {
    const seller = await getSellerByUserId(req.session.user.id);
    res.render('seller/verification', { 
      title: 'Verification Status', 
      user: req.session.user,
      seller: seller
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.redirect('/seller/dashboard');
  }
});

// POST /seller/verification
router.post('/verification', requireLogin, verificationUpload.fields([
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack',  maxCount: 1 },
  { name: 'selfie',  maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { fullName, idNumber } = req.body;

    const nameParts = (fullName || '').trim().split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName  = nameParts.slice(1).join(' ') || 'Unknown';

    const frontImg  = req.files?.idFront?.[0]?.filename || 'pending.jpg';
    const backImg   = req.files?.idBack?.[0]?.filename  || 'pending.jpg';
    const selfieImg = req.files?.selfie?.[0]?.filename  || 'pending.jpg';

    const [[existing]] = await db.query(
      `SELECT id FROM sellers WHERE user_id = ?`, [userId]
    );

    if (existing) {
      await db.query(
        `UPDATE sellers SET
           f_name                = ?,
           l_name                = ?,
           national_id_number    = ?,
           national_id_front_img = ?,
           national_id_back_img  = ?,
           selfie_holding_id_img = ?
         WHERE user_id = ?`,
        [firstName, lastName, idNumber || 0, frontImg, backImg, selfieImg, userId]
      );
    } else {
      await db.query(
        `INSERT INTO sellers
           (f_name, l_name, dob, nationality, address, city, country,
            national_id_number, national_id_front_img, national_id_back_img,
            selfie_holding_id_img, user_id)
         VALUES (?, ?, '2000-01-01', 'Unknown', 'Unknown', 'Unknown', 'Unknown',
                 ?, ?, ?, ?, ?)`,
        [firstName, lastName, idNumber || 0, frontImg, backImg, selfieImg, userId]
      );
    }

    await db.query(`UPDATE users SET is_seller = 1 WHERE id = ?`, [userId]);
    req.session.user.is_seller = 1;

    req.flash('success', '✅ Documents submitted! An admin will review within 24–48 hours.');
    res.redirect('/seller/verification');

  } catch (err) {
    console.error('Verification submission error:', err);
    req.flash('error', '❌ Failed to submit. Please try again.');
    res.redirect('/seller/verification');
  }
});

// ============================================
// PROTECTED SELLER ROUTES
// ============================================
router.use(requireLogin);
router.use(requireSeller);

// Helper function to get analytics
async function getSellerAnalytics(sellerId) {
  try {
    const [revenueResult] = await db.query(
      `SELECT 
         COALESCE(SUM(o.total_price), 0) as totalRevenue,
         COUNT(DISTINCT o.id) as totalOrders,
         SUM(CASE WHEN o.is_paid = 0 THEN 1 ELSE 0 END) as pendingOrders
       FROM orders o
       JOIN offers off ON o.offer_id = off.id
       WHERE off.user_id = ?`,
      [sellerId]
    );
    
    const [monthlyResult] = await db.query(
      `SELECT COALESCE(SUM(o.total_price), 0) as monthlyRevenue
       FROM orders o
       JOIN offers off ON o.offer_id = off.id
       WHERE off.user_id = ? 
         AND o.is_paid = 1
         AND MONTH(o.created_at) = MONTH(CURRENT_DATE())
         AND YEAR(o.created_at) = YEAR(CURRENT_DATE())`,
      [sellerId]
    );
    
    const [comparisonResult] = await db.query(
      `SELECT 
         COALESCE(SUM(CASE 
           WHEN MONTH(o.created_at) = MONTH(CURRENT_DATE()) 
             AND YEAR(o.created_at) = YEAR(CURRENT_DATE())
           THEN o.total_price ELSE 0 END), 0) as thisMonth,
         COALESCE(SUM(CASE 
           WHEN MONTH(o.created_at) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH)
             AND YEAR(o.created_at) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)
           THEN o.total_price ELSE 0 END), 0) as lastMonth
       FROM orders o
       JOIN offers off ON o.offer_id = off.id
       WHERE off.user_id = ?
         AND o.is_paid = 1`,
      [sellerId]
    );
    
    const [chartResult] = await db.query(
      `SELECT 
         DATE(o.created_at) as date,
         COALESCE(SUM(o.total_price), 0) as revenue
       FROM orders o
       JOIN offers off ON o.offer_id = off.id
       WHERE off.user_id = ?
         AND o.is_paid = 1
         AND o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
       GROUP BY DATE(o.created_at)
       ORDER BY date ASC`,
      [sellerId]
    );
    
    const revenueChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const found = chartResult.find(r => {
        const rDate = r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date.split('T')[0];
        return rDate === dateStr;
      });
      revenueChart.push(found ? parseFloat(found.revenue) : 0);
    }
    
    const [listingsResult] = await db.query(
      `SELECT COUNT(*) as activeListings
       FROM offers 
       WHERE user_id = ? AND stock > 0`,
      [sellerId]
    );
    
    const totalPaidOrders = revenueResult[0]?.totalOrders || 0;
    const completedOrders = totalPaidOrders - (revenueResult[0]?.pendingOrders || 0);
    const completionRate = totalPaidOrders > 0 ? Math.round((completedOrders / totalPaidOrders) * 100) : 100;
    
    const [streakData] = await db.query(
      `SELECT DATE(o.created_at) as sale_date
       FROM orders o
       JOIN offers off ON o.offer_id = off.id
       WHERE off.user_id = ? 
         AND o.is_paid = 1
         AND o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY)
       ORDER BY sale_date DESC`,
      [sellerId]
    );
    
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;
    let weeklyProgress = 0;
    
    const uniqueDates = [...new Set(streakData.map(s => {
      const d = s.sale_date instanceof Date ? s.sale_date : new Date(s.sale_date);
      return d.toISOString().split('T')[0];
    }))];
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      
      if (lastDate === null) {
        tempStreak = 1;
      } else {
        const diffDays = Math.floor((lastDate - currentDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      
      bestStreak = Math.max(bestStreak, tempStreak);
      lastDate = currentDate;
    }
    currentStreak = tempStreak;
    
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    weeklyProgress = uniqueDates.filter(date => {
      const d = new Date(date);
      return d >= startOfWeek;
    }).length;
    
    const [sellerRecord] = await db.query(`SELECT id FROM sellers WHERE user_id = ?`, [sellerId]);
    let goalData = { target: 10000, current: 0, tradesTarget: 10, tradesCurrent: 0 };
    
    if (sellerRecord && sellerRecord.length > 0) {
      const [goal] = await db.query(
        `SELECT target_count, current_progress FROM sellers_goal 
         WHERE seller_id = ? ORDER BY created_at DESC LIMIT 1`,
        [sellerRecord[0].id]
      );
      
      if (goal && goal.length > 0) {
        goalData.target = goal[0].target_count * 1000;
        goalData.current = revenueResult[0]?.totalRevenue || 0;
        goalData.tradesTarget = goal[0].target_count;
        goalData.tradesCurrent = totalPaidOrders;
      }
    }
    
    return {
      totalRevenue: parseFloat(revenueResult[0]?.totalRevenue || 0),
      monthlyRevenue: parseFloat(monthlyResult[0]?.monthlyRevenue || 0),
      totalOrders: totalPaidOrders,
      pendingOrders: revenueResult[0]?.pendingOrders || 0,
      activeListings: listingsResult[0]?.activeListings || 0,
      thisMonth: parseFloat(comparisonResult[0]?.thisMonth || 0),
      lastMonth: parseFloat(comparisonResult[0]?.lastMonth || 0),
      completionRate: completionRate,
      avgResponseTime: '< 1 hour',
      revenueChart: revenueChart,
      streak: {
        current: currentStreak,
        best: bestStreak,
        weekly: weeklyProgress
      },
      goal: {
        current: goalData.current,
        target: goalData.target,
        trades: {
          current: goalData.tradesCurrent,
          target: goalData.tradesTarget
        }
      }
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return {
      totalRevenue: 0,
      monthlyRevenue: 0,
      totalOrders: 0,
      pendingOrders: 0,
      activeListings: 0,
      thisMonth: 0,
      lastMonth: 0,
      completionRate: 100,
      avgResponseTime: '< 1 hour',
      revenueChart: [0, 0, 0, 0, 0, 0, 0],
      streak: { current: 0, best: 0, weekly: 0 },
      goal: { current: 0, target: 10000, trades: { current: 0, target: 10 } }
    };
  }
}

// Seller Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const seller = await getSellerByUserId(req.session.user.id);
    const analytics = await getSellerAnalytics(req.session.user.id);
    
    const [listings] = await db.query(
      `SELECT o.*, p.name as product_name, p.image 
       FROM offers o
       JOIN products p ON o.product_id = p.id
       WHERE o.user_id = ? 
       ORDER BY o.created_at DESC`,
      [req.session.user.id]
    );
    
    const [orders] = await db.query(
      `SELECT o.id, o.total_price as amount, o.is_paid as status, p.name as title
       FROM orders o
       JOIN offers off ON o.offer_id = off.id
       JOIN products p ON off.product_id = p.id
       WHERE off.user_id = ?
       ORDER BY o.created_at DESC
       LIMIT 5`,
      [req.session.user.id]
    );
    
    const formattedOrders = orders.map(order => ({
      ...order,
      status: order.status === 1 ? 'completed' : 'pending'
    }));
    
    res.render('seller/dashboard', { 
      title: 'Seller Dashboard', 
      user: req.session.user,
      seller: seller,
      analytics: analytics,
      listings: listings,
      orders: formattedOrders
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('seller/dashboard', { 
      title: 'Seller Dashboard', 
      user: req.session.user,
      seller: null,
      analytics: {
        totalRevenue: 0,
        monthlyRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        activeListings: 0,
        thisMonth: 0,
        lastMonth: 0,
        completionRate: 100,
        avgResponseTime: '< 1 hour',
        revenueChart: [0, 0, 0, 0, 0, 0, 0],
        streak: { current: 0, best: 0, weekly: 0 },
        goal: { current: 0, target: 10000, trades: { current: 0, target: 10 } }
      },
      listings: [],
      orders: []
    });
  }
});

// Manage Listings (Offers)
router.get('/manage-listings', async (req, res) => {
  try {
    const [listings] = await db.query(
      `SELECT o.*, p.name as product_name, p.image, p.description as product_description
       FROM offers o
       JOIN products p ON o.product_id = p.id
       WHERE o.user_id = ? 
       ORDER BY o.created_at DESC`,
      [req.session.user.id]
    );
    
    res.render('seller/manage-listings', { 
      title: 'My Listings', 
      user: req.session.user,
      listings: listings
    });
  } catch (error) {
    console.error('Manage listings error:', error);
    res.render('seller/manage-listings', { 
      title: 'My Listings', 
      user: req.session.user,
      listings: []
    });
  }
});


// Orders
router.get('/orders', async (req, res) => {
  try {
    const [orderRows] = await db.query(
      `SELECT o.id, o.total_price, o.is_paid, o.created_at, o.user_review,
              u.username as buyer_name,
              p.name as product_title,
              off.description as offer_description,
              e.status as escrow_status
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN offers off ON o.offer_id = off.id
       JOIN products p ON off.product_id = p.id
       LEFT JOIN escrow e ON e.order_id = o.id
       WHERE off.user_id = ?
       ORDER BY o.created_at DESC`,
      [req.session.user.id]
    );
    const orders = orderRows.map(o => ({
      id:           o.id,
      title:        o.product_title,
      buyer:        o.buyer_name,
      amount:       parseFloat(o.total_price),
      status:      o.is_paid === 1 ? "completed" : o.is_paid == 2 ? "awaiting buyer confimation" : "pending",
      escrowStatus: o.escrow_status || 'held',
      review:       o.user_review || '',
      dispute:      false,
      createdAt:    o.created_at ? new Date(o.created_at).toISOString().split('T')[0] : '—',
    }));

    res.render('seller/orders', { 
      title: 'Orders', 
      user: req.session.user,
      orders: orders
    });
  } catch (error) {
    console.error('Orders error:', error);
    res.render('seller/orders', { 
      title: 'Orders', 
      user: req.session.user,
      orders: []
    });
  }
});

// Earnings
router.get('/earnings', async (req, res) => {
  try {
    const [earnings] = await db.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN o.is_paid = 1 THEN o.total_price ELSE 0 END), 0) AS totalRevenue,
         COALESCE(SUM(CASE 
           WHEN o.is_paid = 1 
           AND MONTH(o.created_at) = MONTH(CURRENT_DATE())
           AND YEAR(o.created_at) = YEAR(CURRENT_DATE())
           THEN o.total_price ELSE 0 END), 0) AS monthlyRevenue,
         COALESCE(SUM(CASE 
           WHEN o.is_paid = 1 
           AND MONTH(o.created_at) = MONTH(CURRENT_DATE())
           AND YEAR(o.created_at) = YEAR(CURRENT_DATE())
           THEN o.total_price ELSE 0 END), 0) AS thisMonth,
         COALESCE(SUM(CASE 
           WHEN o.is_paid = 1 
           AND MONTH(o.created_at) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH)
           AND YEAR(o.created_at) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)
           THEN o.total_price ELSE 0 END), 0) AS lastMonth,
         COALESCE(SUM(CASE WHEN o.is_paid = 0 THEN o.total_price ELSE 0 END), 0) AS pendingPayout,
         0 AS totalWithdrawn,
COUNT(CASE WHEN o.is_paid = 1 THEN 1 END) AS totalOrders
       FROM orders o
       JOIN offers off ON o.offer_id = off.id
       WHERE off.user_id = ?`,
      [req.session.user.id]
    );
    
    const [chartResult] = await db.query(
  `SELECT DATE(o.created_at) as date, COALESCE(SUM(o.total_price), 0) as revenue
   FROM orders o JOIN offers off ON o.offer_id = off.id
   WHERE off.user_id = ? AND o.is_paid = 1
     AND o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
   GROUP BY DATE(o.created_at) ORDER BY date ASC`,
  [req.session.user.id]
);

const [ordersChartResult] = await db.query(
  `SELECT DATE(o.created_at) as date, COUNT(o.id) as count
   FROM orders o JOIN offers off ON o.offer_id = off.id
   WHERE off.user_id = ? AND o.is_paid = 1
     AND o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
   GROUP BY DATE(o.created_at) ORDER BY date ASC`,
  [req.session.user.id]
);

const [topGamesResult] = await db.query(
  `SELECT p.name, COUNT(o.id) as orderCount
   FROM orders o JOIN offers off ON o.offer_id = off.id
   JOIN products p ON off.product_id = p.id
   WHERE off.user_id = ? AND o.is_paid = 1
   GROUP BY p.id, p.name ORDER BY orderCount DESC LIMIT 5`,
  [req.session.user.id]
);
const revenueChart = [];
const ordersChart = [];
for (let i = 6; i >= 0; i--) {
  const date = new Date();
  date.setDate(date.getDate() - i);
  const dateStr = date.toISOString().split('T')[0];

  const revFound = chartResult.find(r => {
    const d = r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date.split('T')[0];
    return d === dateStr;
  });
  revenueChart.push(revFound ? parseFloat(revFound.revenue) : 0);

  const ordFound = ordersChartResult.find(r => {
    const d = r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date.split('T')[0];
    return d === dateStr;
  });
  ordersChart.push(ordFound ? parseInt(ordFound.count) : 0);
}

const topGames = topGamesResult.length > 0
  ? topGamesResult.map(g => g.name)
  : ['No sales yet'];
    res.render('seller/earnings', { 
      title: 'Earnings', 
      user: req.session.user,
      analytics: {
  ...earnings[0],
  revenueChart,
  ordersChart,
  topGames,
}
    });
  } catch (error) {
    console.error('Earnings error:', error);
    res.render('seller/earnings', { 
      title: 'Earnings', 
      user: req.session.user,
      analytics: {
  totalRevenue: 0, monthlyRevenue: 0, thisMonth: 0,
  lastMonth: 0, pendingPayout: 0, totalWithdrawn: 0,
  totalOrders: 0,
  revenueChart: [0, 0, 0, 0, 0, 0, 0],
  ordersChart:  [0, 0, 0, 0, 0, 0, 0],
  topGames:     ['No sales yet'],
}
    });
  }
});

// CREATE PRODUCT (not offer) - This is what your form wants
router.get('/create-listing', async (req, res) => {
  try {
    res.render('seller/create-listing', { 
      title: 'Create Product', 
      user: req.session.user,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error('Create product form error:', error);
    res.render('seller/create-listing', { 
      title: 'Create Product', 
      user: req.session.user,
      error: 'Failed to load form: ' + error.message,
      success: null
    });
  }
});

// CREATE PRODUCT - Process form (matches your database schema)
router.post('/create-listing', upload.single('image'), async (req, res) => {
  try {
    const { 
      name,           // Product name from form
      description,    // Product description
      category,       // Store in description or separate field? Your DB has no category column
      game,           // Store in description
      tags,           // Store in description
      deliveryTime,   // Store in description
      deliveryInstructions,
      price,          // This will be used for the initial offer
      stock           // This will be used for the initial offer
    } = req.body;
    
    console.log('Received product data:', { name, description, price, stock, user_id: req.session.user.id });
    
    // Validation
    const errors = [];
    if (!name || name.trim() === '') errors.push('Product name is required');
    if (!description || description.trim() === '') errors.push('Description is required');
    if (!price || price <= 0) errors.push('Valid price is required');
    if (!stock || stock < 1) errors.push('Valid stock quantity is required');
    
    if (errors.length > 0) {
      req.flash('error', errors.join(', '));
      return res.redirect('/seller/create-listing');
    }
    
    // In your POST route, handle missing file
let image = 'default-product.jpg';
if (req.file) {
  image = req.file.filename;
} else {
  console.log('No image uploaded, using default');
}
    
    // Build enhanced description with all form fields
    let fullDescription = description;
    if (category) fullDescription += `\n\n🎮 Category: ${category}`;
    if (game) fullDescription += `\n🎯 Game: ${game}`;
    if (deliveryTime) fullDescription += `\n⚡ Delivery: ${deliveryTime}`;
    if (deliveryInstructions) fullDescription += `\n📝 Instructions: ${deliveryInstructions}`;
    if (tags) fullDescription += `\n🏷️ Tags: ${tags}`;
    
    // Insert product
    const [result] = await db.query(
      `INSERT INTO products (name, description, image, user_id, created_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [name.trim(), fullDescription, image, req.session.user.id]
    );
    
    const productId = result.insertId;
    
    // Get a service ID (use first available service)
    const [services] = await db.query(`SELECT id FROM services LIMIT 1`);
    const serviceId = services && services.length > 0 ? services[0].id : 1;
    
    // Create initial offer for this product
    await db.query(
      `INSERT INTO offers (product_id, service_id, user_id, price, description, stock, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [productId, serviceId, req.session.user.id, price, `Standard offer for ${name}`, stock]
    );
    
    req.flash('success', 'Product created successfully! It will appear in the marketplace.');
    res.redirect('/seller/manage-listings');
  } catch (error) {
    console.error('Create product error:', error);
    req.flash('error', 'Failed to create product: ' + error.message);
    res.redirect('/seller/create-listing');
  }
});

// Affiliate
router.get('/affiliate', async (req, res) => {
  try {
    const [wallet] = await db.query(
      `SELECT afflieate_earn_amount as earnings FROM wallet WHERE user_id = ?`,
      [req.session.user.id]
    );
    
    const affiliateCode = req.session.user.id;
    
    res.render('seller/affiliate', { 
      title: 'Affiliate Program', 
      user: req.session.user,
      affiliate: {
        code: affiliateCode,
        earnings: wallet[0]?.earnings || 0,
        clicks: 0,
        conversions: 0
      }
    });
  } catch (error) {
    console.error('Affiliate error:', error);
    res.render('seller/affiliate', { 
      title: 'Affiliate Program', 
      user: req.session.user,
      affiliate: {
        code: `SELLER${req.session.user.id}`,
        earnings: 0,
        clicks: 0,
        conversions: 0
      }
    });
  }
});

// Goal
router.get('/goal', async (req, res) => {
  try {
    const [seller] = await db.query(
      `SELECT id FROM sellers WHERE user_id = ?`,
      [req.session.user.id]
    );
    
    if (!seller || seller.length === 0) {
      throw new Error('Seller not found');
    }
    
    let [goal] = await db.query(
      `SELECT * FROM sellers_goal 
       WHERE seller_id = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [seller[0].id]
    );
    
    if (!goal || goal.length === 0) {
      const targetCount = 10;
      const durationDays = 30;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);
      
      await db.query(
        `INSERT INTO sellers_goal (seller_id, goal_type, target_count, duration_days, start_date, end_date, current_progress, is_achieved, current_streak, max_streak) 
         VALUES (?, 'sales', ?, ?, ?, ?, 0, 0, 0, 0)`,
        [seller[0].id, targetCount, durationDays, startDate, endDate]
      );
      
      goal = [{ target_count: targetCount, current_progress: 0 }];
    }
    
    const [sales] = await db.query(
      `SELECT COUNT(*) as current
       FROM orders o
       JOIN offers off ON o.offer_id = off.id
       WHERE off.user_id = ? 
         AND o.is_paid = 1
         AND YEAR(o.created_at) = YEAR(CURRENT_DATE())`,
      [req.session.user.id]
    );
    
    const percentage = (sales[0].current / goal[0].target_count) * 100;
    
   res.render('seller/goal', { 
      title: 'Sales Goals', 
      user: req.session.user,
      goal: {
        target:     goal[0].target_count,
        current:    sales[0].current,
        percentage: Math.min(percentage, 100),
        trades: {
          current: sales[0].current,
          target:  goal[0].target_count
        }
      }
    });
  } catch (error) {
    console.error('Goal error:', error);
    res.render('seller/goal', { 
      title: 'Sales Goals', 
      user: req.session.user,
      goal: {
        current: 0,
        target: 10,
        percentage: 0,
        trades: {
          current: 0,
          target: 10
        }
      }
    });
  }
});

// Streak
router.get('/streak', async (req, res) => {
  try {
    const [sales] = await db.query(
      `SELECT DATE(o.created_at) as sale_date
       FROM orders o
       JOIN offers off ON o.offer_id = off.id
       WHERE off.user_id = ? 
         AND o.is_paid = 1
         AND o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
       ORDER BY sale_date DESC`,
      [req.session.user.id]
    );
    
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;
    
    const uniqueDates = [...new Set(sales.map(s => {
      const d = s.sale_date instanceof Date ? s.sale_date : new Date(s.sale_date);
      return d.toISOString().split('T')[0];
    }))];
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      
      if (lastDate === null) {
        tempStreak = 1;
      } else {
        const diffDays = Math.floor((lastDate - currentDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      
      bestStreak = Math.max(bestStreak, tempStreak);
      lastDate = currentDate;
    }
    
    currentStreak = tempStreak;
    
    res.render('seller/streak', { 
      title: 'Sales Streak', 
      user: req.session.user,
      streak: {
        current: currentStreak,
        best: bestStreak,
        lastSale: lastDate
      }
    });
  } catch (error) {
    console.error('Streak error:', error);
    res.render('seller/streak', { 
      title: 'Sales Streak', 
      user: req.session.user,
      streak: {
        current: 0,
        best: 0,
        lastSale: null
      }
    });
  }
});

// Mark order as complete
router.post('/orders/:id/complete', requireLogin, async (req, res) => {
    const orderId = req.params.id;
    await db.query(`UPDATE orders SET is_paid = 2 WHERE id = ?`, [orderId]);
    res.redirect('/seller/orders');
});

// Chat page
router.get('/chat/:orderId', requireLogin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const [[order]] = await db.query(
      `SELECT o.id, p.name as title, u.username as buyer, u.id as buyerId
       FROM orders o
       JOIN offers off ON o.offer_id = off.id
       JOIN products p ON off.product_id = p.id
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ? AND off.user_id = ?`,
      [orderId, req.session.user.id]
    );

    if (!order) {
      req.flash('error', 'Order not found.');
      return res.redirect('/seller/orders');
    }

    res.render('seller/chat', {
      title: 'Chat',
      user: req.session.user,
      order,
      messages: [] // no chat table yet — empty for now
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.redirect('/seller/orders');
  }
});


module.exports = router;