// routes/pages.js
const express = require('express');
const router = express.Router();

// 🆕 الـ Route الخاص بفتح صفحة الشات
router.get('/chat/:orderId', (req, res) => {
  const { orderId } = req.params;
  
  // التأكد من وجود يوزر في السيشين، لو مش موجود بنكتب Guest
  const username = req.session.user ? req.session.user.username : 'Guest';

  // رندر صفحة الـ chat.ejs اللي هنعملها في الخطوة 2
  res.render('pages/chat', { 
    title: `Chat - Order #${orderId}`,
    orderId: orderId,
    username: username
  });
});

module.exports = router;