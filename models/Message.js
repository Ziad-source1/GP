const mongoose = require('mongoose');

// تصميم شكل الرسالة في قاعدة البيانات
const messageSchema = new mongoose.Schema({
  room: { 
    type: String, 
    required: true,
    index: true // عملنا Index هنا عشان السرعة لما الغرف تكتر
  },
  sender: { 
    type: String, 
    required: true 
  },
  text: { 
    type: String, 
    required: true 
  }
}, { timestamps: true }); // بتعمل حقول createdAt و updatedAt تلقائياً

module.exports = mongoose.model('Message', messageSchema);