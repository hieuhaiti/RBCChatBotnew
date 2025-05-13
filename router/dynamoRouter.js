const express = require('express');
const router = express.Router();
const dynamoController = require('../controller/dynamoController');

// Customers
// Lưu thông tin khách hàng
router.post('/customers', dynamoController.saveCustomer);
// Lấy thông tin khách hàng
router.get('/customers/:senderId', dynamoController.getCustomer);
// Xóa thông tin khách hàng
router.delete('/customers/:senderId', dynamoController.deleteCustomer);

// Prompts
// Lưu prompt
router.post('/prompts', dynamoController.savePrompt);
// Lấy prompt
router.get('/prompts', dynamoController.getPrompt);
// Xóa prompt
router.delete('/prompts', dynamoController.deletePrompt);

// Threads
// Lấy thông tin thread
router.get('/threads/:senderId', dynamoController.getThread);
// Tạo thread
router.post('/threads', dynamoController.createThread);
// Xóa thread
router.delete('/threads/:senderId', dynamoController.deleteThread);

// FAQs
// Lưu FAQ
router.post('/faqs', dynamoController.saveFAQ);
// Lấy FAQ
router.get('/faqs', dynamoController.getFAQs);
// Xóa FAQ
router.delete('/faqs/:faqId', dynamoController.deleteFAQ);

// TokenUsage
// Lấy token usage
router.get('/token-usage', dynamoController.getTokenUsage);
// Thêm token usage
router.post('/token-usage', dynamoController.addTokenUsage);

module.exports = router;