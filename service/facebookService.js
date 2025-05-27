const axios = require('axios');
const openAiService = require('../service/openAiService');
const dynamoService = require('../service/dynamoService');
const logger = require('./utils/Logger');

// Send message to Facebook
async function sendMessage(pageId, recipientId, text) {
    try {
        console.log(`Gửi tin nhắn đến Facebook: ${recipientId} - ${text}`);
        const messageData = {
            recipient: { id: recipientId },
            messaging_type: 'RESPONSE',
            message: { text },
        };
        const result = await dynamoService.getItem("PagesRBC", { pageID: pageId });
        console.log(`Lấy thông tin trang Facebook: ${JSON.stringify(result)}`);

        const pageAccessToken = result.accessToken
        await axios.post(`${process.env.GRAPH_FACEBOOK_URL}/me/messages`, messageData, {
            params: { access_token: pageAccessToken },
            headers: { 'Content-Type': 'application/json' },
        });
        console.log(`Tin nhắn đã gửi đến Facebook: ${recipientId} - ${text}`);

        logger.info(`✅ Tin nhắn đã gửi đến ${recipientId}: ${text}`);
        return true;
    } catch (error) {
        console.error("❌ Lỗi gửi tin nhắn:", {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });

        return false;
    }

}

//  Lấy tên khách hàng từ Facebook
// async function getUserNameFromFacebook(senderId) {
//     try {
//         const response = await axios.get(`${process.env.GRAPH_FACEBOOK_URL}/${senderId}`, {
//             params: {
//                 fields: 'name',
//                 access_token: process.env.PAGE_ACCESS_TOKEN,
//             },
//         });
//         return response.data.name || 'không xác định';
//     } catch (error) {
//         console.error(`Lỗi lấy tên khách hàng từ Facebook: ${error.message}`);
//         return 'không xác định';
//     }
// }

// handleCustomerMessage
async function handleCustomerMessage(senderId, pageId, message) {
    try {
        // Gửi tin nhắn đến OpenAI
        const response = await openAiService.getAssistantReply(senderId, pageId, message);
        // Gửi phản hồi đến khách hàng
        await sendMessage(pageId, senderId, response.text);
    } catch (error) {
        console.error(`Lỗi xử lý tin nhắn khách hàng: ${error.message}`);
    }
}


module.exports = {
    sendMessage,
    handleCustomerMessage,
};