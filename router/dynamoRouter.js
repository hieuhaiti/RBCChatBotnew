// routes/rbcRouter.js
const express = require('express');
const router = express.Router();
const controller = require('../controller/dynamoController');

/**
 * @swagger
 * tags:
 *   - name: DynamoRBC
 *     description: API thao tác với DynamoDB (RBC tables [UsersRBC, SubscriptionsRBC, PagesRBC, AssistantsRBC, CustomersRBC, TokenUsageRBC, FAQsRBC])
 */

/**
 * @swagger
 * /dynamo/{table}/{id}:
 *   get:
 *     tags: [DynamoRBC]
 *     summary: Lấy một item theo ID
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: Tên bảng
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Giá trị của khóa chính
 *     responses:
 *       200:
 *         description: Trả về item tương ứng
 *       404:
 *         description: Không tìm thấy
 */

/**
 * @swagger
 * /dynamo/{table}:
 *   post:
 *     tags: [DynamoRBC]
 *     summary: Tạo hoặc cập nhật một item
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: Tên bảng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Item đã được tạo hoặc cập nhật
 */

/**
 * @swagger
 * /dynamo/{table}:
 *   delete:
 *     tags: [DynamoRBC]
 *     summary: Xóa một item theo khóa
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: Tên bảng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Key dùng để xóa item
 *     responses:
 *       200:
 *         description: Đã xóa thành công
 */

/**
 * @swagger
 * /dynamo/scan/{table}:
 *   get:
 *     tags: [DynamoRBC]
 *     summary: Quét toàn bộ bảng DynamoDB
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: Tên bảng cần quét
 *     responses:
 *       200:
 *         description: Danh sách item trong bảng
 */

/**
 * @swagger
 * /dynamo/query:
 *   post:
 *     tags: [DynamoRBC]
 *     summary: Truy vấn theo chỉ mục phụ (GSI)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tableName:
 *                 type: string
 *               indexName:
 *                 type: string
 *               keyName:
 *                 type: string
 *               keyValue:
 *                 type: string
 *               rangeKeyName:
 *                 type: string
 *               rangeKeyValue:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kết quả truy vấn
 */

// Truy vấn theo GSI (POST /query)
// Body ví dụ: { "tableName": "...", "indexName": "...", "keyName": "...", "keyValue": "...", "rangeKeyName": "...", "rangeKeyValue": "..." }
router.post('/query', controller.queryByIndex);

// Quét tất cả item trong bảng (GET /scan/:table)
router.get('/scan/:table', controller.scanTable);

// Lấy 1 item theo khóa chính (GET /:table/:id)
router.get('/:table/:id', controller.getItem);

// Thêm hoặc cập nhật item (POST /:table)
router.post('/:table', controller.putItem);

// Xóa item theo key (DELETE /:table)
// Body truyền key cần xóa (ví dụ: { "userID": "123" })
router.delete('/:table', controller.deleteItem);


module.exports = router;
