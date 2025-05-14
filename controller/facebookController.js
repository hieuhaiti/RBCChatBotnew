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

// Handle incoming messages
async function handleFacebookMessage(req, res) {
    try {
        const { object, entry } = req.body;

        if (object !== 'page') {
            return res.sendStatus(404);
        }

        const webhookEvent = entry[0].messaging[0];
        const senderId = webhookEvent.sender.id;
        const message = webhookEvent.message.text;
        const timestamp = webhookEvent.timestamp;
        if (webhookEvent.message && message) {
            logger.info(`Tin nhắn từ ${senderId} lúc ${dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}: ${message}`);
            const response = await facebookService.handleCustomerMessage(message, senderId, logger);
            if (response) {
                await facebookService.sendMessage(senderId, response.text, [], logger, 5000);
            } else {
                await facebookService.sendMessage(senderId, "Xin lỗi, tôi không hiểu câu hỏi của bạn.", [], logger, 5000);
            }
        }

        res.sendStatus(200);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    verifyWebhook,
    handleFacebookMessage
};