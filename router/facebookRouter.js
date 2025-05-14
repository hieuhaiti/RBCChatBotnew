const express = require('express');
const router = express.Router();
const facebookController = require('../controller/facebookController');

// Webhook verification
router.get('/webhook', facebookController.verifyWebhook);
// Handle incoming messages
router.post('/webhook', facebookController.handleFacebookMessage);
