const express = require('express');
const router = express.Router();
const openAiController = require('../controller/openAiController');

// get thread ID
router.get('/thread/:senderId', openAiController.getThreadId);
// get assistant response
router.post('/thread/:threadId', openAiController.getAssistantResponse);
