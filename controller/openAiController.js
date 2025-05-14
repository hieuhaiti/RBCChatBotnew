const openAiService = require('../service/openAiService');

// get openAi thread ID
async function getThreadId(req, res) {
    try {
        const { senderId } = req.params;
        const openAi = await openAiService.getThreadId(senderId);
        res.status(200).json(openAi);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


// get assistant response
async function getAssistantResponse(req, res) {
    try {
        const { threadId } = req.query;
        const { senderId, prompt } = req.body;
        const response = await openAiService.getAssistantResponse(
            threadId,
            senderId,
            prompt,
        );
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


module.exports = {
    getThreadId,
    getAssistantResponse,
};
