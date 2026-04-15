// In controllers/sellerController.js

const db = require('../models/db');
const { getSellerByUserId, createSeller, updateUser } = require('../models/data');

// Add this helper function at the top of the file or in a separate model
async function getSellerAnalytics(sellerId) {
    try {
        // Get total revenue and orders
        const [revenueResult] = await db.query(
            `SELECT 
                COALESCE(SUM(total_amount), 0) as totalRevenue,
                COUNT(*) as totalOrders,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders
             FROM orders 
             WHERE seller_id = ?`,
            [sellerId]
        );
        
        // Get monthly revenue
        const [monthlyResult] = await db.query(
            `SELECT COALESCE(SUM(total_amount), 0) as monthlyRevenue
             FROM orders 
             WHERE seller_id = ? 
               AND MONTH(created_at) = MONTH(CURRENT_DATE())
               AND YEAR(created_at) = YEAR(CURRENT_DATE())`,
            [sellerId]
        );
        
        // Get active listings
        const [listingsResult] = await db.query(
            `SELECT COUNT(*) as activeListings
             FROM products 
             WHERE seller_id = ? AND status = 'active'`,
            [sellerId]
        );
        
        return {
            totalRevenue: revenueResult[0]?.totalRevenue || 0,
            monthlyRevenue: monthlyResult[0]?.monthlyRevenue || 0,
            totalOrders: revenueResult[0]?.totalOrders || 0,
            pendingOrders: revenueResult[0]?.pendingOrders || 0,
            activeListings: listingsResult[0]?.activeListings || 0
        };
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return {
            totalRevenue: 0,
            monthlyRevenue: 0,
            totalOrders: 0,
            pendingOrders: 0,
            activeListings: 0
        };
    }
}

const sellerController = {
    // Dashboard
    dashboard: async (req, res) => {
        try {
            const seller = await getSellerByUserId(req.session.user.id);
            const analytics = await getSellerAnalytics(req.session.user.id);
            
            res.render('seller/dashboard', { 
                title: 'Seller Dashboard', 
                user: req.session.user,
                seller: seller,
                analytics: analytics  // ← This is what was missing!
            });
        } catch (error) {
            console.error('Dashboard error:', error);
            res.render('seller/dashboard', { 
                title: 'Seller Dashboard', 
                user: req.session.user,
                seller: null,
                analytics: {  // ← Fallback data
                    totalRevenue: 0,
                    monthlyRevenue: 0,
                    totalOrders: 0,
                    pendingOrders: 0,
                    activeListings: 0
                }
            });
        }
    },
    
    // Add other methods here (orders, earnings, etc.)
    orders: async (req, res) => {
        try {
            const [orders] = await db.query(
                `SELECT o.*, u.username as buyer_name, p.title as product_title
                 FROM orders o
                 JOIN users u ON o.buyer_id = u.id
                 JOIN products p ON o.product_id = p.id
                 WHERE o.seller_id = ?
                 ORDER BY o.created_at DESC`,
                [req.session.user.id]
            );
            
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
    },
    
    earnings: async (req, res) => {
        try {
            const [earnings] = await db.query(
                `SELECT 
                    COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as totalRevenue,
                    COALESCE(SUM(CASE 
                        WHEN status = 'completed' 
                        AND MONTH(created_at) = MONTH(CURRENT_DATE())
                        AND YEAR(created_at) = YEAR(CURRENT_DATE())
                        THEN total_amount ELSE 0 END), 0) as monthlyRevenue,
                    COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END), 0) as pendingPayout
                 FROM orders 
                 WHERE seller_id = ?`,
                [req.session.user.id]
            );
            
            res.render('seller/earnings', { 
                title: 'Earnings', 
                user: req.session.user,
                analytics: earnings[0]
            });
        } catch (error) {
            console.error('Earnings error:', error);
            res.render('seller/earnings', { 
                title: 'Earnings', 
                user: req.session.user,
                analytics: {
                    totalRevenue: 0,
                    monthlyRevenue: 0,
                    pendingPayout: 0
                }
            });
        }
    },
    
    // Add remaining methods (manageListings, showCreateListing, createListing, affiliate, goal, streak, verification)
    // ... (similar pattern as above)
};

module.exports = sellerController;