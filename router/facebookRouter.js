const express = require('express');
const router = express.Router();
const facebookController = require('../controller/facebookController');

/**
 * @swagger
 * tags:
 *   - name: Facebook
 *     description: API for Facebook Messenger operations
 */

/**
 * @swagger
 * /facebook/webhook:
 *   get:
 *     tags: [Facebook]
 *     summary: Xác minh webhook từ Facebook
 *     responses:
 *       200:
 *         description: Thành công
 *
 *   post:
 *     tags: [Facebook]
 *     summary: Xử lý tin nhắn Facebook gửi đến
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             object: "page"
 *             entry:
 *               - time: 1747197392110
 *                 id: "102602424668201"
 *                 messaging:
 *                   - sender:
 *                       id: "9668085513282853"
 *                     recipient:
 *                       id: "102602424668201"
 *                     timestamp: 1747197392110
 *                     message:
 *                       mid: "m_39PC_fZoVshq8eAtasrVVD0G0zzudeKPHBsZkVW6rkNc4hqnTASFUZyupDNMe3Ga93g3njfv_vS2qucx1NiVuw"
 *                       text: "tôi tên hiếu hà muốn tư vấn thiết kế thi công công trình biệt thự hiện đại"
 *     responses:
 *       200:
 *         description: Tin nhắn đã được xử lý thành công
 */

// Webhook verification
router.get('/webhook', facebookController.verifyWebhook);
// Handle incoming messages
router.post('/webhook', facebookController.handleFacebookMessage);

module.exports = router;