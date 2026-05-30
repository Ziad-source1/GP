const db = require('../models/db');


// ── Dashboard ──────────────────────────────────────────────────────────────
exports.dashboard = async (req, res) => {
  try {
    const [[{ totalUsers }]]   = await db.query(`SELECT COUNT(*) AS totalUsers FROM users`);
    const [[{ totalSellers }]] = await db.query(`SELECT COUNT(*) AS totalSellers FROM users WHERE role = 'seller' OR role = 'both'`);
    const [[{ totalListings }]]= await db.query(`SELECT COUNT(*) AS totalListings FROM offers`);
    const [[{ totalOrders }]]  = await db.query(`SELECT COUNT(*) AS totalOrders FROM orders`);
    const [[{ totalRevenue }]] = await db.query(`SELECT COALESCE(SUM(total_price), 0) AS totalRevenue FROM orders WHERE is_paid = 1`);
    const [[{ pendingVerif }]] = await db.query(
      `SELECT COUNT(*) AS pendingVerif FROM sellers s JOIN users u ON s.user_id = u.id WHERE u.is_verified = 0`
    );

    const stats = {
      users:                totalUsers,
      sellers:              totalSellers,
      listings:             totalListings,
      orders:               totalOrders,
      revenue:              parseFloat(totalRevenue),
      pendingVerifications: pendingVerif,
    };

    const [orderRows] = await db.query(
      `SELECT o.id, p.name AS title, o.total_price AS amount, o.is_paid, o.created_at, e.status AS escrowStatus
       FROM orders o
       JOIN offers off ON o.offer_id = off.id
       JOIN products p ON off.product_id = p.id
       LEFT JOIN escrow e ON e.order_id = o.id
       ORDER BY o.created_at DESC LIMIT 10`
    );

    const recentOrders = orderRows.map(o => ({
      id:           String(o.id).padStart(3, '0'),
      title:        o.title,
      amount:       parseFloat(o.amount),
      status:       o.is_paid ? 'completed' : 'in_progress',
      escrowStatus: o.escrowStatus || 'held',
      createdAt:    o.created_at ? new Date(o.created_at).toISOString().split('T')[0] : '—',
    }));

    const [userRows] = await db.query(
      `SELECT username, email, role, is_verified, created_at FROM users ORDER BY created_at DESC LIMIT 10`
    );

    const users = userRows.map(u => ({
      username: u.username,
      email:    u.email,
      role:     u.role,
      verified: u.is_verified === 1,
      joinDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '—',
    }));

    res.render('admin/dashboard', {
      title: 'Admin Dashboard — LEVEL UP',
      user: req.session.user,
      stats,
      recentOrders,
      users,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).render('pages/500', { title: 'Server Error', user: req.session.user });
  }
};

// ── User Management ────────────────────────────────────────────────────────
exports.userManagement = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.email, u.role, u.is_verified, u.is_blocked, u.created_at,
              COALESCE(w.balance, 0) AS balance
       FROM users u
       LEFT JOIN wallet w ON w.user_id = u.id
       ORDER BY u.created_at DESC`
    );

    const users = rows.map(u => ({
      id:       u.id,
      username: u.username,
      email:    u.email,
      role:     u.role,
      verified: u.is_verified === 1,
      blocked:  u.is_blocked === 1,
      balance:  parseFloat(u.balance),
      joinDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '—',
    }));

    res.render('admin/users', {
      title: 'User Management — LEVEL UP',
      user: req.session.user,
      users,
    });
  } catch (err) {
    console.error('User management error:', err);
    res.status(500).render('pages/500', { title: 'Server Error', user: req.session.user });
  }
};

// ── Seller Verification ────────────────────────────────────────────────────
exports.verificationReview = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.id, u.username, u.email, s.created_at AS submittedAt,
              s.national_id_front_img, s.national_id_back_img, s.selfie_holding_id_img,
              s.nationality, s.city, s.country
       FROM sellers s
       JOIN users u ON s.user_id = u.id
       WHERE u.is_verified = 0
       ORDER BY s.created_at DESC`
    );

    const pending = rows.map(p => ({
      id:           p.id,
      username:     p.username,
      email:        p.email,
      submittedAt:  p.submittedAt ? new Date(p.submittedAt).toISOString().split('T')[0] : '—',
      docType:      'National ID',
      nationality:  p.nationality,
      city:         p.city,
      country:      p.country,
      frontImg:     p.national_id_front_img,
      backImg:      p.national_id_back_img,
      selfieImg:    p.selfie_holding_id_img,
    }));

    res.render('admin/verification', {
      title: 'Seller Verification — LEVEL UP',
      user: req.session.user,
      pending,
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).render('pages/500', { title: 'Server Error', user: req.session.user });
  }
};

// ── Escrow Monitor ─────────────────────────────────────────────────────────
exports.escrowMonitoring = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT o.id, p.name AS title, o.total_price AS amount, o.is_paid,
              o.created_at, e.status AS escrowStatus, e.released_at
       FROM orders o
       JOIN offers off ON o.offer_id = off.id
       JOIN products p ON off.product_id = p.id
       LEFT JOIN escrow e ON e.order_id = o.id
       ORDER BY o.created_at DESC`
    );

    // Stats from real data
    const totalHeld     = rows.filter(o => (o.escrowStatus || 'held') === 'held' || (o.escrowStatus || 'held') === 'pending')
                              .reduce((s, o) => s + parseFloat(o.amount), 0);
    const activeHolds   = rows.filter(o => !o.escrowStatus || o.escrowStatus === 'pending').length;
    const releasedToday = rows.filter(o => {
      if (!o.released_at) return false;
      const today = new Date().toISOString().split('T')[0];
      return new Date(o.released_at).toISOString().split('T')[0] === today;
    }).reduce((s, o) => s + parseFloat(o.amount), 0);

    const orders = rows.map(o => ({
  rawId:          o.id,
  id:             String(o.id).padStart(3, '0'),
  title:          o.title,
  amount:         parseFloat(o.amount),
  escrowStatus:   o.escrowStatus || 'held',
  buyerConfirmed: o.is_paid === 1,
  createdAt:      o.created_at ? new Date(o.created_at).toISOString().split('T')[0] : '—',
}));

    res.render('admin/escrow', {
      title: 'Escrow Monitor — LEVEL UP',
      user: req.session.user,
      orders,
      escrowStats: {
        totalHeld:    totalHeld.toLocaleString(),
        activeHolds,
        releasedToday: releasedToday.toLocaleString(),
      },
    });
  } catch (err) {
    console.error('Escrow error:', err);
    res.status(500).render('pages/500', { title: 'Server Error', user: req.session.user });
  }
};

// ── Dispute Resolution ─────────────────────────────────────────────────────
// No disputes table exists — showing unpaid orders with a review as disputes
exports.disputeResolution = async (req, res) => {
  try {
    const [disputes] = await db.query(
  `SELECT d.id AS disputeId, o.id AS id, o.total_price AS amount,
          u.username AS buyer, u.id AS buyerId,
          p.name AS item,
          d.status AS status,
          d.description AS reason,
          seller_u.username AS seller, seller_u.id AS sellerId
   FROM orders o
   JOIN users u ON o.user_id = u.id
   JOIN disputes d ON d.order_id = o.id
   JOIN offers off ON o.offer_id = off.id
   JOIN products p ON off.product_id = p.id
   JOIN users seller_u ON off.user_id = seller_u.id
   WHERE d.status = 0
   ORDER BY o.created_at DESC`
);
    console.log("DBG::disputes",disputes);

    res.render('admin/disputes', {
      title: 'Dispute Resolution — LEVEL UP',
      user: req.session.user,
      disputes,
    });
  } catch (err) {
    console.error('Disputes error:', err);
    res.status(500).render('pages/500', { title: 'Server Error', user: req.session.user });
  }
};

// ── Fraud Detection ────────────────────────────────────────────────────────
// No fraud table — flagging blocked users and high dispute-rate sellers from real data
exports.fraudDetection = async (req, res) => {
  try {
    // Blocked users
    const [blockedUsers] = await db.query(
      `SELECT username, email, created_at FROM users WHERE is_blocked = 1`
    );

    // Sellers with unpaid orders (potential fraud signals)
    const [disputedSellers] = await db.query(
      `SELECT u.username, COUNT(o.id) AS disputeCount
       FROM orders o
       JOIN offers off ON o.offer_id = off.id
       JOIN users u ON off.user_id = u.id
       WHERE o.is_paid = 0
       GROUP BY u.id, u.username
       HAVING COUNT(o.id) >= 1`
    );

    const flags = [
      ...blockedUsers.map(u => ({
        user:     u.username,
        reason:   'Account is blocked by admin',
        severity: 'high',
        time:     u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '—',
      })),
      ...disputedSellers.map(s => ({
        user:     s.username,
        reason:   `Has ${s.disputeCount} unpaid/disputed order(s)`,
        severity: s.disputeCount >= 2 ? 'high' : 'medium',
        time:     'Recent activity',
      })),
    ];

    res.render('admin/fraud', {
      title: 'Fraud Detection — LEVEL UP',
      user: req.session.user,
      flags,
    });
  } catch (err) {
    console.error('Fraud detection error:', err);
    res.status(500).render('pages/500', { title: 'Server Error', user: req.session.user });
  }
};

// ── Commission Settings ────────────────────────────────────────────────────
exports.commissionControl = async (req, res) => {
  const [[{balance: commission}]] = await db.query('SELECT balance FROM wallet where user_id = 179');
  res.render('admin/commission', {
    title: 'Commission Control — LEVEL UP',
    user: req.session.user,
    commission : commission
  });
};

// ── Featured Listings ──────────────────────────────────────────────────────
exports.featuredControl = async (req, res) => {
  try {
    const [listings] = await db.query(
      `SELECT p.id, p.name, p.image, p.description, u.username AS seller,
              MIN(o.price) AS minPrice
       FROM products p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN offers o ON o.product_id = p.id
       GROUP BY p.id, p.name, p.image, p.description, u.username
       ORDER BY p.created_at DESC`
    );
    res.render('admin/featured', {
      title: 'Featured Listings — LEVEL UP',
      user: req.session.user,
      listings,
    });
  } catch (err) {
    console.error('Featured error:', err);
    res.status(500).render('pages/500', { title: 'Server Error', user: req.session.user });
  }
};

// ── Approve / Reject Verification ─────────────────────────────────────────
exports.approveVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const [[seller]] = await db.query(`SELECT user_id FROM sellers WHERE id = ?`, [id]);
    if (seller) {
      await db.query(
        `UPDATE users SET is_verified = 1, is_seller = 1, role = 'seller' WHERE id = ?`,
        [seller.user_id]
      );
    }
    req.flash('success', 'Seller verified successfully!');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to approve.');
  }
  res.redirect('/admin/verification');
};

exports.rejectVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const [[seller]] = await db.query(`SELECT user_id FROM sellers WHERE id = ?`, [id]);
    if (seller) {
      await db.query(`UPDATE users SET is_blocked = 1 WHERE id = ?`, [seller.user_id]);
    }
    req.flash('error', 'Seller verification rejected.');
  } catch (err) {
    console.error(err);
  }
  res.redirect('/admin/verification');
};
exports.releaseEscrow = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if escrow row exists for this order
    const [[existing]] = await db.query(
      `SELECT id FROM escrow WHERE order_id = ?`, [id]
    );

    if (existing) {
      // Update existing escrow row
      await db.query(
        `UPDATE escrow SET status = 'released', released_at = NOW() WHERE order_id = ?`,
        [id]
      );
    } else {
      // Get order amount to create escrow row
      const [[order]] = await db.query(
        `SELECT total_price FROM orders WHERE id = ?`, [id]
      );
      // Insert new escrow row
      await db.query(
        `INSERT INTO escrow (order_id, amount, status, released_at) VALUES (?, ?, 'released', NOW())`,
        [id, order.total_price]
      );
    }

    // Mark order as paid
    await db.query(
      `UPDATE orders SET is_paid = 1 WHERE id = ?`, [id]
    );

    req.flash('success', `✅ Escrow released for order #${id}`);
  } catch (err) {
    console.error('Release escrow error:', err);
    req.flash('error', '❌ Failed to release escrow.');
  }
  res.redirect('/admin/escrow');
};

// ── Dispute: Refund Buyer ──────────────────────────────────────────────────
exports.resolveRefundBuyer = async (req, res) => {
  try {
    const { id } = req.params; // dispute id

    // Get dispute + order + buyer info
    const [[dispute]] = await db.query(
      `SELECT d.id, d.order_id, o.total_price, o.user_id AS buyerId
       FROM disputes d
       JOIN orders o ON o.id = d.order_id
       WHERE d.id = ?`, [id]
    );

    if (!dispute) {
      req.flash('error', 'Dispute not found.');
      return res.redirect('/admin/disputes');
    }

    // 1. Refund buyer wallet
    await db.query(
      `UPDATE wallet SET balance = balance + ? WHERE user_id = ?`,
      [dispute.total_price, dispute.buyerId]
    );

    // 2. Update escrow to refunded
    await db.query(
      `UPDATE escrow SET status = 'refunded', released_at = NOW() WHERE order_id = ?`,
      [dispute.order_id]
    );

    // 3. Close the dispute
    await db.query(
      `UPDATE disputes SET status = 1 WHERE id = ?`, [id]
    );

    req.flash('success', `✅ Dispute #${id} resolved — buyer refunded.`);
  } catch (err) {
    console.error('Resolve refund error:', err);
    req.flash('error', '❌ Failed to resolve dispute.');
  }
  res.redirect('/admin/disputes');
};

// ── Dispute: Release to Seller ─────────────────────────────────────────────
exports.resolveReleaseSeller = async (req, res) => {
  try {
    const { id } = req.params; // dispute id

    // Get dispute + order + seller info
    const [[dispute]] = await db.query(
      `SELECT d.id, d.order_id, o.total_price, off.user_id AS sellerId
       FROM disputes d
       JOIN orders o ON o.id = d.order_id
       JOIN offers off ON off.id = o.offer_id
       WHERE d.id = ?`, [id]
    );

    if (!dispute) {
      req.flash('error', 'Dispute not found.');
      return res.redirect('/admin/disputes');
    }

    // 1. Pay seller wallet
    await db.query(
      `UPDATE wallet SET balance = balance + ? WHERE user_id = ?`,
      [dispute.total_price, dispute.sellerId]
    );

    // 2. Update escrow to released
    await db.query(
      `UPDATE escrow SET status = 'released', released_at = NOW() WHERE order_id = ?`,
      [dispute.order_id]
    );

    // 3. Mark order as paid
    await db.query(
      `UPDATE orders SET is_paid = 1 WHERE id = ?`, [dispute.order_id]
    );

    // 4. Close the dispute
    await db.query(
      `UPDATE disputes SET status = 1 WHERE id = ?`, [id]
    );

    req.flash('success', `✅ Dispute #${id} resolved — funds released to seller.`);
  } catch (err) {
    console.error('Resolve release error:', err);
    req.flash('error', '❌ Failed to resolve dispute.');
  }
  res.redirect('/admin/disputes');
};