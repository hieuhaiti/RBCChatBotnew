const axios = require('axios');
const dynamoService = require('../service/dynamoService');
const openAiService = require('../service/openAiService');
const handleEntities = require('../service/utils/handleEntities');
const schemaFields = require('../config/schemaFields');

// Send message to Facebook
async function sendMessage(recipientId, text, quickReplies = [], logger, api_timeout) {
    try {
        const messageData = {
            recipient: { id: recipientId },
            messaging_type: 'RESPONSE',
            message: quickReplies.length
                ? {
                    text,
                    quick_replies: quickReplies.map((reply) => ({
                        content_type: reply.content_type || 'text',
                        title: reply.title,
                        payload: reply.payload || reply.title,
                    })),
                }
                : { text },
        };
        const response = await axios.post(`${process.env.GRAPH_FACEBOOK_URL}/me/messages`, messageData, {
            params: { access_token: process.env.PAGE_ACCESS_TOKEN },
            headers: { 'Content-Type': 'application/json' },
            timeout: api_timeout,
        });

        logger.info('Gửi tin nhắn thành công:', response.data);
        return true;
    } catch (error) {
        logger.error(`Lỗi gửi tin nhắn: ${error.response?.data || error.message}`);
        return false;
    }
}

// Get FAQ response
async function getFAQResponse(message, logger, getFAQ) {
    try {
        const faqs = await getFAQ();
        logger.info(`Dữ liệu FAQ trả về: ${JSON.stringify(faqs)}`);

        if (!Array.isArray(faqs)) {
            logger.warn('FAQs không phải là mảng, trả về null');
            return null;
        }

        for (const faq of faqs) {
            const keywords = faq.question.toLowerCase().split(/\s+/);
            const messageWords = message.toLowerCase().split(/\s+/);
            const matchCount = keywords.filter(keyword => messageWords.includes(keyword)).length;
            if (matchCount > 0 && matchCount / keywords.length >= 0.5) {
                return faq;
            }
        }
        return null;
    } catch (error) {
        logger.error(`Lỗi lấy FAQ: ${error.message}`, { stack: error.stack });
        return null;
    }
}

// Lấy tên khách hàng từ Facebook
async function getUserNameFromFacebook(senderId, logger) {
    console.log(`${process.env.GRAPH_FACEBOOK_URL}/${senderId}`);
    // try {
    //     const response = await axios.get(`${process.env.GRAPH_FACEBOOK_URL}/${senderId}`, {
    //         params: {
    //             fields: 'name',
    //             access_token: process.env.PAGE_ACCESS_TOKEN,
    //         },
    //         timeout: api_timeout,
    //     });
    //     return response.data.name || 'không xác định';
    // } catch (error) {
    //     logger.error(`Lỗi lấy tên khách hàng từ Facebook: ${error.message}`);
    //     return 'không xác định';
    // }
    return "không xác định";
}

async function handleCustomerMessage(message, senderId, logger) {
    logger.info(`Xử lý tin nhắn từ ${senderId}: ${message}$`);
    let customer = await dynamoService.getCustomerInfo(senderId);
    const facebookName = await getUserNameFromFacebook(senderId, logger);
    const name = customer?.name || facebookName;
    const entities = handleEntities.extractEntities(message, schemaFields);
    if (name !== customer?.name) {
        entities = handleEntities.updatedEntities(entities, facebookName);
    }
    customer = customer
        ? await dynamoService.saveCustomerInfo({ ...customer, ...entities }, senderId)
        : await dynamoService.saveCustomerInfo(entities, senderId);
    message = message.toLowerCase().trim();

    const faqResponse = await getFAQResponse(lowerMessage, logger, dynamoService.getFAQ);
    if (faqResponse) {
        logger.info(`Trả lời từ FAQ cho câu hỏi: ${lowerMessage}`);
        let responseText = faqResponse.response_text.replace('${name}', name);
        responseText = responseText
            .replace('${phone}', customer.phone || 'chưa có')
            .replace('${project}', customer.project || 'chưa có')
            .replace('${style}', customer.style || 'chưa có')
            .replace('${budget}', customer.budget ? `${customer.budget} triệu` : 'chưa có')
            .replace('${area}', customer.area || 'chưa có');
        const quickReplies = faqResponse.quick_replies || [];
        if (faqResponse.entities) {
            await dynamoService.saveCustomerInfo({ ...customer, ...faqResponse.entities }, senderId);
        }

        return {
            text: responseText,
            quick_replies: quickReplies,
        };
    };
    logger.info(`Gọi Assistant cho ${senderId}`);
    const threadId = await openAiService.getThreadId(senderId);
    const prompt = await dynamoService.getPrompt();
    const promptContent = JSON.stringify({
        sender_id: senderId,
        message,
        prompt,
        customer: {
            name: customer.name,
            phone: customer.phone,
            project: customer.project,
            style: customer.style,
            budget: customer.budget,
            area: customer.area,
        },
    });
    const runId = await openAiService.sendMessageToGPT(threadId, promptContent);
    const response = await openAiService.getAssistantResponse(
        threadId,
        runId,
        senderId,
        Number(process.env.POLL_MAX_ATTEMPTS),
        Number(process.env.POLL_MAX_DELAY),
        Number(process.env.API_TIMEOUT_MS)
    );
    if (response.entities) {
        await saveCustomerInfo({ ...customer, ...response.entities }, senderId);
    }
    logger.info(`Phản hồi từ Assistant: ${response.text}`, { quick_replies: response.quick_replies });
    return { text: response.text, quick_replies: response.quick_replies || [] };
};

module.exports = {
    sendMessage,
    handleCustomerMessage,
};