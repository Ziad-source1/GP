const express = require('express');
const router = express.Router();
const { getChatHistory } = require('../controllers/ChatController.js');

// المسار المسؤول عن الـ Chat History
router.get('/messages/:room', getChatHistory);

module.exports = router;