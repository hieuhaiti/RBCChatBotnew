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

        const pageAccessToken = result.accessToken
        await axios.post(`${process.env.GRAPH_FACEBOOK_URL}/me/messages`, messageData, {
            params: { access_token: pageAccessToken },
            headers: { 'Content-Type': 'application/json' },
        });
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
async function getUserNameFromFacebook(senderId) {
    try {
        const response = await axios.get(`${process.env.GRAPH_FACEBOOK_URL}/${senderId}`, {
            params: {
                fields: 'name',
                access_token: process.env.PAGE_ACCESS_TOKEN,
            },
        });
        return response.data.name || 'không xác định';
    } catch (error) {
        console.error(`Lỗi lấy tên khách hàng từ Facebook: ${error.message}`);
        return 'không xác định';
    }
}

// async function getUserNameFromFacebook(senderId, pageId) {
//     try {
//         const page = await dynamoService.getItem("PagesRBC", { pageID: pageId });
//         if (!page || !page.accessToken) {
//             throw new Error(`No access token found for page ${pageId}`);
//         }
//         const response = await axios.get(`${process.env.GRAPH_FACEBOOK_URL}/${senderId}`, {
//             params: {
//                 fields: 'name',
//                 access_token: page.accessToken,
//             },
//         });
//         return response.data.name || 'không xác định';
//     } catch (error) {
//         logger.error(`Lỗi lấy tên khách hàng từ Facebook cho senderId ${senderId}, pageId ${pageId}: ${error.message}`);
//         return 'không xác định';
//     }
// }

// handleCustomerMessage
async function handleCustomerMessage(senderId, pageId, message) {
    try {
        // Gửi tin nhắn đến OpenAI
        const response = await openAiService.getResponseMessenger(senderId, pageId, message);
        // Gửi phản hồi đến khách hàng
        await sendMessage(pageId, senderId, response.text);
    } catch (error) {
        // console.error(`Lỗi xử lý tin nhắn khách hàng: ${error.message}`);
    }
}


module.exports = {
    sendMessage,
    handleCustomerMessage,
    // getUserNameFromFacebook
};