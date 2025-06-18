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
            // logger.warn('⛔️ Tin nhắn không có nội dung text hoặc không hợp lệ.');
            return;
        }

        logger.info(`🟡 Tin nhắn ${messageId} từ ${senderId} tới ${recipientId} lúc ${dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}: ${message}`);

        const result = await dynamoService.getItem("CustomersRBC", { customerID: senderId, pageID: recipientId });

        if (!result) {
            const customerData = {
                customerID: senderId,
                pageID: recipientId,
                createAt: new Date().toISOString(),
                updateAt: new Date().toISOString(),
                threadId: '',
                phone: '',
                name: '',
                attribute: {},
            };
            await dynamoService.putItem("CustomersRBC", customerData);
            logger.info(`🟢 Tạo mới khách hàng ${senderId} trên page ${recipientId}`);
        }

        if (!messageStore[senderId]) {
            messageStore[senderId] = { messages: [], timer: null, lastTimestamp: timestamp };
        }

        messageStore[senderId].messages.push(message);
        messageStore[senderId].lastTimestamp = timestamp;

        if (messageStore[senderId].timer) {
            clearTimeout(messageStore[senderId].timer);
        }

        messageStore[senderId].timer = setTimeout(async () => {
            const fullMessage = messageStore[senderId].messages.join(' ');

            // Trích xuất SDT nếu có
            const entities = extractEntities(fullMessage, [{ name: 'phone' }]);
            if (entities.phone) {
                const customer = await dynamoService.getItem("CustomersRBC", { customerID: senderId, pageID: recipientId });
                if (customer && customer.phone !== entities.phone) {
                    await dynamoService.putItem("CustomersRBC", {
                        ...customer,
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
                await facebookService.sendMessage(recipientId, senderId, matchedFaq.answer);
                logger.info(`💡 Phản hồi từ FAQ: ${matchedFaq.question}`);
                delete messageStore[senderId];
                return;
            }

            // Gửi OpenAI nếu không có trong FAQ
            await facebookService.handleCustomerMessage(senderId, recipientId, fullMessage)
                .catch((error) => {
                    logger.error(`🔴 Lỗi gửi phản hồi đến ${senderId}: ${error.message}`);
                });

            delete messageStore[senderId];
        }, 7000);

    } catch (error) {
        logger.error(`🔴 Lỗi trong handleFacebookMessage: ${error.message}`);
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
