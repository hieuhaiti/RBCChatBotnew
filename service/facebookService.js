const axios = require('axios');
const dynamoService = require('../service/dynamoService');
const openAiService = require('../service/openAiService');
const handleEntities = require('../service/utils/handleEntities');
const schemaFields = require('../config/schemaFields');

// Send message to Facebook
async function sendMessage(recipientId, text) {
    try {
        const messageData = {
            recipient: { id: recipientId },
            messaging_type: 'RESPONSE',
            message: { text },
        };
        const response = await axios.post(`${process.env.GRAPH_FACEBOOK_URL}/me/messages`, messageData, {
            params: { access_token: process.env.PAGE_ACCESS_TOKEN },
            headers: { 'Content-Type': 'application/json' },
        });
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
async function handleCustomerMessage(senderId, message) {
    try {
        // Gửi tin nhắn đến OpenAI
        const response = await openAiService.getAssistantReply(senderId, message);

        console.log(response);
        console.log(response.text);

        // Gửi phản hồi đến khách hàng
        await sendMessage(senderId, response.text);
    } catch (error) {
        console.error(`Lỗi xử lý tin nhắn khách hàng: ${error.message}`);
    }
}


module.exports = {
    sendMessage,
    handleCustomerMessage,
};