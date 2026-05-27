const Message = require('../models/Message.js');

// جلب تاريخ المحادثة لغرفة معينة
const getChatHistory = async (req, res) => {
  try {
    const { room } = req.params;
    // بنجيب الرسائل الخاصة بالغرفة دي بس وبنترتبها من الأقدم للأحدث
    const messages = await Message.find({ room }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

module.exports = { getChatHistory };