const express = require('express');
const router = express.Router();
const openAiController = require('../controller/openAiController');

// get thread ID
/**
 * @swagger
 * tags:
 *   - name: OpenAI
 *     description: API thao tác với các bảng trong OpenAI
 */

/**
 * @swagger
 * /openai/thread/{senderId}:
 *   get:
 *     tags: [OpenAI]
 *     summary: Lấy thread ID của người dùng
 *     parameters:
 *       - in: path
 *         name: senderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trả về thread ID
 */
router.get('/thread/:senderId', openAiController.getThreadId);
// get assistant response
/**
 * @swagger
 * /openai/thread/{threadId}:
 *   post:
 *     tags: [OpenAI]
 *     summary: Gửi nội dung vào Assistant và nhận phản hồi
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderId:
 *                 type: string
 *               prompt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phản hồi từ Assistant
 */

router.post('/thread/:threadId', openAiController.getAssistantResponse);

module.exports = router;