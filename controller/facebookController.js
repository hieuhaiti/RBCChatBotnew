const facebookService = require('../service/facebookService');
const dynamoService = require('../service/dynamoService');
const logger = require("../service/utils/Logger");
const dayjs = require('dayjs');
const { extractEntities } = require('../service/utils/handleEntities');

// Verify the webhook
async function verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
            return res.status(200).send(challenge);
        } else {
            return res.sendStatus(403);
        }
    }
}

const messageStore = {};

// Handle incoming messages
async function handleFacebookMessage(req, res) {
    try {
        const { object, entry } = req.body;

        if (object !== 'page') return res.sendStatus(404);
        res.sendStatus(200);

        const messagingEvent = entry?.[0]?.messaging?.[0];
        const pageId = entry?.[0]?.id;
        if (!messagingEvent) {
            // logger.warn('⛔️ Không tìm thấy sự kiện messaging trong payload.');
            return;
        }

        const senderId = messagingEvent.sender?.id;
        const recipientId = messagingEvent.recipient?.id; // pageID
        const message = messagingEvent.message?.text;
        const timestamp = messagingEvent.timestamp;
        const messageId = messagingEvent.message?.mid;

        if (!messagingEvent.message || !message) {
            return;
        }

        logger.info(`🟡 Tin nhắn ${senderId} tới ${recipientId} lúc ${dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}: ${message}`);

        if (!senderId || !recipientId) {
            logger.error(`Invalid senderId: ${senderId} or recipientId: ${recipientId}`);
            return;
        }

        // logger.info(`Querying CustomersRBC with customerID: ${senderId}`);
        let customer = await dynamoService.getItem("CustomersRBC", { customerID: senderId });

        if (!customer || customer.pageID !== recipientId) {
            const customerData = {
                customerID: senderId,
                pageID: recipientId,
                createAt: new Date().toISOString(),
                updateAt: new Date().toISOString(),
                threadId: '',
                phone: '',
                name: '',
                attribute: {},
                conversationCount: 0, // Khởi tạo conversationCount
            };
            await dynamoService.putItem("CustomersRBC", customerData);
            // logger.info(`🟢 Tạo mới khách hàng ${senderId} trên page ${recipientId}`);
            customer = customerData;
        }

        if (!messageStore[senderId]) {
            messageStore[senderId] = { 
                messages: [], 
                timer: null, 
                lastTimestamp: timestamp, 
                conversationCount: customer.conversationCount || 0, 
                reminderSent: false 
            };
        }

        messageStore[senderId].messages.push(message);
        messageStore[senderId].lastTimestamp = timestamp;

        if (messageStore[senderId].timer) {
            clearTimeout(messageStore[senderId].timer);
        }

        messageStore[senderId].timer = setTimeout(async () => {
            const fullMessage = messageStore[senderId].messages.join(' ');

            // Tăng conversationCount
            messageStore[senderId].conversationCount += 1;
            const newConversationCount = messageStore[senderId].conversationCount;

            // Cập nhật conversationCount vào CustomersRBC
            await dynamoService.putItem("CustomersRBC", {
                ...customer,
                conversationCount: newConversationCount,
                updateAt: new Date().toISOString(),
            });
            // logger.info(`📊 Cập nhật conversationCount cho ${senderId}: ${newConversationCount}`);

            // Trích xuất SDT nếu có
            const entities = extractEntities(fullMessage, [{ name: 'phone' }]);
            if (entities.phone) {
                const updatedCustomer = await dynamoService.getItem("CustomersRBC", { customerID: senderId });
                if (updatedCustomer && updatedCustomer.phone !== entities.phone && updatedCustomer.pageID === recipientId) {
                    await dynamoService.putItem("CustomersRBC", {
                        ...updatedCustomer,
                        phone: entities.phone,
                        updateAt: new Date().toISOString(),
                    });
                    logger.info(`📞 Cập nhật SDT cho ${senderId}: ${entities.phone}`);
                }
            }

            // Check phản hồi từ FAQ trước
            const faqs = await dynamoService.queryByIndex(
                'FAQsRBC',
                'PageIndex',
                'pageID',
                recipientId
            );

            const matchedFaq = faqs.find(faq =>
                fullMessage.toLowerCase().includes(faq.question.toLowerCase())
            );

            if (matchedFaq) {
                logger.info(`Matched FAQ: ${matchedFaq.question}, sending response: ${matchedFaq.answer}`);
                await facebookService.sendMessage(recipientId, senderId, matchedFaq.answer);
                logger.info(`💡 Phản hồi từ FAQ: ${matchedFaq.question}`);
                // logger.info(`Xóa messageStore cho senderId: ${senderId}`);
                delete messageStore[senderId];
                return;
            } else {
                // logger.info(`Không tìm thấy FAQ phù hợp cho tin nhắn: ${fullMessage}`);
            }

            // Gửi nhắc nhở nếu conversationCount <= 3 và chưa gửi
            if (messageStore[senderId].conversationCount <= 3 && !messageStore[senderId].reminderSent) {
                // logger.info(`📊 Dưới 3 lượt trò chuyện cho ${senderId}, chuẩn bị gửi nhắc nhở sau 1 giờ`);
                messageStore[senderId].timer = setTimeout(async () => {
                    const reminderMessage = "Dạ không biết anh chị đang băn khoăn gì để bên em hỗ trợ a/c ạ?😊";
                    await facebookService.sendMessage(recipientId, senderId, reminderMessage);
                    logger.info(`🔔 Gửi tin nhắn nhắc nhở đến ${senderId} trên page ${recipientId}`);
                    if (messageStore[senderId]) {
                        messageStore[senderId].reminderSent = true;
                    }
                }, 3600000); // 1 giờ 
            }

            // Gửi OpenAI nếu không có trong FAQ
            // logger.info(`Gửi tin nhắn đến OpenAI cho senderId: ${senderId}, nội dung: ${fullMessage}`);
            await facebookService.handleCustomerMessage(senderId, recipientId, fullMessage)
                .catch((error) => {
                    logger.error(`🔴 Lỗi gửi phản hồi đến ${senderId}: ${error.message}, Stack: ${error.stack}`);
                });
            // logger.info(`Phản hồi OpenAI đã gửi cho senderId: ${senderId}`);
            // logger.info(`Xóa messageStore cho senderId: ${senderId}`);
            delete messageStore[senderId];
        }, 7000);

    } catch (error) {
        logger.error(`🔴 Lỗi trong handleFacebookMessage: ${error.message}, Stack: ${error.stack}`);
        res.sendStatus(500);
    }
}

// Gửi tin nhắn đến một user cụ thể
async function sendMessageToId(req, res) {
    const { pageId, reciverId, message } = req.body;
    try {
        await facebookService.sendMessage(pageId, reciverId, message);
        res.status(200).json({ success: true });
    } catch (error) {
        logger.error(`🔴 Lỗi gửi tin nhắn đến ${reciverId}: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    verifyWebhook,
    handleFacebookMessage,
    sendMessageToId
};