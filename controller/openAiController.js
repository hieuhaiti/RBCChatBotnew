const openAiService = require('../service/openAiService');
const logger = require('../service/utils/Logger');

async function createdThread(req, res) {
    try {
        const threadId = await openAiService.createdThread();
        if (!threadId) {
            return res.status(500).json({ error: 'Error creating thread' });
        }
        res.status(200).json({ threadId });
    } catch (error) {
        logger.error('Route error: POST /openai/threads', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getMessages(req, res) {
    const { threadId } = req.params;
    try {
        const messages = await openAiService.getMessages(threadId);
        res.status(200).json(messages);
    } catch (error) {
        logger.error(`Route error: GET /openai/threads/${threadId}/messages`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getAssistant(req, res) {
    const { pageId } = req.params;
    try {
        const assistant = await openAiService.getAssistant(pageId);
        res.status(200).json(assistant);
    } catch (error) {
        logger.error(`Route error: GET /openai/assistants/${pageId}`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function createdAssistant(req, res) {
    try {
        const assistantId = await openAiService.createdAssistant();
        if (!assistantId) {
            return res.status(500).json({ error: 'Error creating assistant' });
        }
        res.status(200).json({ assistantId });
    } catch (error) {
        logger.error('Route error: POST /openai/assistants', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function updateAssistant(req, res) {
    const { assistantId } = req.params;
    const { instructions } = req.body;
    try {
        const updatedId = await openAiService.updateAssistant(assistantId, instructions);
        res.status(200).json({ updatedId });
    } catch (error) {
        logger.error(`Route error: PATCH /openai/assistants/${assistantId}`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getAssistantReply(req, res) {
    const { assistantId, threadId } = req.params;
    const { message } = req.body;

    try {
        const response = await openAiService.getAssistantReply(assistantId, threadId, message);
        res.status(200).json(response);
    } catch (error) {
        logger.error(`Route error: POST /openai/assistants/${pageId}/reply`, error);
        logger.error(`Route error: POST /openai/assistants/${assistantId}/threads/${threadId}/reply`, error);
    }
}

module.exports = {
    createdThread,
    getMessages,
    getAssistant,
    createdAssistant,
    updateAssistant,
    getAssistantReply
};
