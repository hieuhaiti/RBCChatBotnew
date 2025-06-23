const axios = require('axios');
const openAiService = require('../service/openAiService');
const dynamoService = require('../service/dynamoService');
const logger = require('./utils/Logger');

// Send message to Facebook
async function sendMessage(pageId, recipientId, text) {
    try {
        const messageData = {
            recipient: { id: recipientId },
            messaging_type: 'RESPONSE',
            message: { text },
        };
        const result = await dynamoService.getItem("PagesRBC", { pageID: pageId });
        if (!result || !result.accessToken) {
            logger.error(`Không tìm thấy access token cho pageID: ${pageId}`);
            return false;
        }
        const pageAccessToken = result.accessToken;
        // logger.info(`Gửi tin nhắn đến ${recipientId} với accessToken: ${pageAccessToken.substring(0, 10)}...`);
        const response = await axios.post(`${process.env.GRAPH_FACEBOOK_URL}/me/messages`, messageData, {
            params: { access_token: pageAccessToken },
            headers: { 'Content-Type': 'application/json' },
        });
        logger.info(`✅ Tin nhắn đã gửi đến ${recipientId}: ${text}, Response: ${JSON.stringify(response.data)}`);
        return true;
    } catch (error) {
        logger.error(`❌ Lỗi gửi tin nhắn đến ${recipientId}: ${error.message}, Status: ${error.response?.status}, Data: ${JSON.stringify(error.response?.data)}`);
        return false;
    }
}

// Lấy tên khách hàng từ Facebook
async function getUserNameFromFacebook(senderId) {
    try {
        const response = await axios.get(`${process.env.GRAPH_FACEBOOK_URL}/${senderId}`, {
            params: {
                fields: 'name',
                access_token: process.env.PAGE_ACCESS_TOKEN,
            },
        });
        logger.info(`Lấy tên khách hàng ${senderId}: ${response.data.name}`);
        return response.data.name || 'không xác định';
    } catch (error) {
        logger.error(`Lỗi lấy tên khách hàng từ Facebook: ${error.message}`);
        return 'không xác định';
    }
}

// handleCustomerMessage
async function handleCustomerMessage(senderId, pageId, message) {
    try {
        // logger.info(`Gửi tin nhắn đến OpenAI: senderId=${senderId}, pageId=${pageId}, message=${message}`);
        // Gửi tin nhắn đến OpenAI
        const response = await openAiService.getResponseMessenger(senderId, pageId, message);
        // logger.info(`Phản hồi từ OpenAI: ${JSON.stringify(response)}`);
        // Gửi phản hồi đến khách hàng
        await sendMessage(pageId, senderId, response.text);
        logger.info(`Đã gửi phản hồi OpenAI đến ${senderId}`);
    } catch (error) {
        // logger.error(`Lỗi xử lý tin nhắn khách hàng: ${error.message}, Stack: ${error.stack}`);
    }
}

module.exports = {
    sendMessage,
    handleCustomerMessage,
    getUserNameFromFacebook
};