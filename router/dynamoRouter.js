const express = require('express');
const router = express.Router();
const dynamoController = require('../controller/dynamoController');
/**
 * @swagger
 * tags:
 *   - name: DynamoDB
 *     description: API thao tác với các bảng trong DynamoDB
 */
/**
 * @swagger
 * /table/{tableName}:
 *   get:
 *     tags: [DynamoDB]
 *     summary: Lấy dữ liệu từ bảng DynamoDB
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         schema:
 *           type: string
 *         description: Tên bảng DynamoDB cần truy xuất
 *     responses:
 *       200:
 *         description: Dữ liệu từ bảng
 */

/**
 * @swagger
 * /customers/{senderId}:
 *   get:
 *     tags: [DynamoDB]
 *     summary: Lấy thông tin khách hàng
 *     parameters:
 *       - in: path
 *         name: senderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của khách hàng
 *     responses:
 *       200:
 *         description: Thông tin khách hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "9668085513282853"
 *                 name:
 *                   type: string
 *                   example: "Duy Bùi"
 *                 phone:
 *                   type: string
 *                   example: ""
 *                 area:
 *                   type: string
 *                   example: "Hà Nội"
 *                 budget:
 *                   type: number
 *                   example: 0
 *                 project:
 *                   type: string
 *                   example: "nhà ở"
 *                 style:
 *                   type: string
 *                   example: "hiện đại"
 *                 threadId:
 *                   type: string
 *                   example: "thread_abc123"
 *                 lastInteraction:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /customers:
 *   post:
 *     tags: [DynamoDB]
 *     summary: Lưu thông tin khách hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       200:
 *         description: Đã lưu
 */

/**
 * @swagger
 * /customers/{senderId}:
 *   delete:
 *     tags: [DynamoDB]
 *     summary: Xóa khách hàng
 *     parameters:
 *       - in: path
 *         name: senderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID khách hàng
 *     responses:
 *       200:
 *         description: Đã xóa
 */

/**
 * @swagger
 * /prompts:
 *   get:
 *     tags: [DynamoDB]
 *     summary: Lấy prompt hiện tại
 *     responses:
 *       200:
 *         description: Prompt hiện tại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 prompt:
 *                   type: string
 *                   example: "điệu bộ giống con người nhiều"
 *
 *   post:
 *     tags: [DynamoDB]
 *     summary: Lưu prompt mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đã lưu
 *
 *   delete:
 *     tags: [DynamoDB]
 *     summary: Xóa prompt hiện tại
 *     responses:
 *       200:
 *         description: Đã xóa
 */

/**
 * @swagger
 * /faqs:
 *   get:
 *     tags: [DynamoDB]
 *     summary: Lấy danh sách câu hỏi thường gặp
 *     responses:
 *       200:
 *         description: Danh sách FAQ
 *
 *   post:
 *     tags: [DynamoDB]
 *     summary: Lưu một FAQ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               response_text:
 *                 type: string
 *               quick_replies:
 *                 type: array
 *                 items:
 *                   type: object
 *               entities:
 *                 type: object
 *     responses:
 *       200:
 *         description: Đã lưu
 */

/**
 * @swagger
 * /faqs/{faqId}:
 *   delete:
 *     tags: [DynamoDB]
 *     summary: Xóa một FAQ
 *     parameters:
 *       - in: path
 *         name: faqId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã xóa
 */

/**
 * @swagger
 * /token-usage:
 *   post:
 *     tags: [DynamoDB]
 *     summary: Ghi log token usage
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderId:
 *                 type: string
 *               promptTokens:
 *                 type: number
 *               completionTokens:
 *                 type: number
 *     responses:
 *       200:
 *         description: Đã ghi log
 *
 * /token-usage/{token_id}:
 *   get:
 *     tags: [DynamoDB]
 *     summary: Lấy token usage theo ID
 *     parameters:
 *       - in: path
 *         name: token_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token usage
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "9668085513282853"
 *         name:
 *           type: string
 *           example: "Duy Bùi"
 *         phone:
 *           type: string
 *         area:
 *           type: string
 *           example: "Hà Nội"
 *         budget:
 *           type: number
 *           example: 0
 *         project:
 *           type: string
 *         style:
 *           type: string
 *         threadId:
 *           type: string
 *         lastInteraction:
 *           type: string
 *           format: date-time
 */

router.get('/table/:tableName', dynamoController.getTableData);
router.get('/customers/:senderId', dynamoController.getCustomer);
router.post('/customers', dynamoController.saveCustomer);
router.delete('/customers/:senderId', dynamoController.deleteCustomer);
router.get('/prompts', dynamoController.getPrompt);
router.post('/prompts', dynamoController.savePrompt);
router.delete('/prompts/:promptId', dynamoController.deletePrompt);
router.get('/faqs', dynamoController.getFAQ); // question query (biệt thự)
router.post('/faqs', dynamoController.saveFAQ); //faq body
router.delete('/faqs/:faqId', dynamoController.deleteFAQ);
router.get('/token-usage/:token_id', dynamoController.getTokenUsage);
// const { promptTokens, completionTokens, senderId } = req.body;
router.post('/token-usage', dynamoController.addTokenUsage);
module.exports = router;