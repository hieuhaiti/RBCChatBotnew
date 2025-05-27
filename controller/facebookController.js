const facebookService = require('../service/facebookService');
const logger = require("../service/utils/Logger");
const dayjs = require('dayjs');

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

        if (object !== 'page') {
            return res.sendStatus(404);
        }
        res.sendStatus(200);
        const webhookEvent = entry[0].messaging[0];
        const pageId = entry[0].id;
        const senderId = webhookEvent.sender.id;
        const message = webhookEvent.message.text;
        const timestamp = webhookEvent.timestamp;
        const messageId = webhookEvent.message.mid;

        if (webhookEvent.message && message) {
            logger.info(`🟡 Tin nhắn ${messageId} từ ${senderId} tới ${pageId} lúc ${dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}: ${message}`);

            // Khởi tạo hoặc cập nhật messageStore cho senderId
            if (!messageStore[senderId]) {
                messageStore[senderId] = { messages: [], timer: null, lastTimestamp: timestamp };
            }

            // Thêm tin nhắn mới vào danh sách
            messageStore[senderId].messages.push(message);
            messageStore[senderId].lastTimestamp = timestamp;

            // Hủy bộ hẹn giờ cũ nếu có
            if (messageStore[senderId].timer) {
                clearTimeout(messageStore[senderId].timer);
            }

            // Đặt bộ hẹn giờ mới để chờ 20 giây
            messageStore[senderId].timer = setTimeout(async () => {
                // Ghép tất cả tin nhắn thành một chuỗi
                const fullMessage = messageStore[senderId].messages.join(' ');

                // Xử lý tin nhắn ghép
                await facebookService.handleCustomerMessage(senderId, pageId, fullMessage)
                    .catch((error) => {
                        logger.error(`🔴 Lỗi gửi phản hồi đến ${senderId}: ${error.message}`);
                    });

                // Xóa dữ liệu của senderId sau khi xử lý
                delete messageStore[senderId];
            }, 20 * 1000); // 20 giây
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Send message to a specific user ID
async function sendMessageToId(req, res) {
    const { pageId, reciverId, message } = req.body;
    try {
        await facebookService.sendMessage(pageId, reciverId, message);
        res.status(200).json({ success: true });
    } catch (error) {
        logger.error(`🔴 Lỗi gửi tin nhắn đến ${id}: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    verifyWebhook,
    handleFacebookMessage,
    sendMessageToId
};