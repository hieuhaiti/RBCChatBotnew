const axios = require("axios");
const dynamoService = require("./dynamoService");
const logger = require("../service/utils/Logger");

const threadLocks = new Set();

const HEADERS = {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    "OpenAI-Beta": "assistants=v2",
    "Content-Type": "application/json",
};

const OPENAI_URL = process.env.OPENAI_URL;

async function getOrCreateThread(senderId) {
    const customer = await dynamoService.getCustomerInfo(senderId);
    if (customer.threadId) return customer.threadId;

    const { data } = await axios.post(`${OPENAI_URL}/threads`, {}, { headers: HEADERS });
    await dynamoService.saveCustomerInfo({ ...customer, threadId: data.id }, senderId);
    return data.id;
}

async function lockThread(threadId, fn) {
    if (threadLocks.has(threadId)) return null;
    threadLocks.add(threadId);
    try {
        return await fn();
    } finally {
        threadLocks.delete(threadId);
    }
}

async function sendMessage(threadId, prompt) {
    await axios.post(
        `${OPENAI_URL}/threads/${threadId}/messages`,
        { role: 'user', content: prompt },
        { headers: HEADERS, timeout: Number(process.env.API_TIMEOUT_MS || 10000) }
    );
    const { data } = await axios.post(
        `${OPENAI_URL}/threads/${threadId}/runs`,
        { assistant_id: process.env.ASSISTANT_ID },
        { headers: HEADERS }
    );
    return data.id;
}

async function waitForRunCompletion(threadId, runId) {
    const maxAttempts = Number(process.env.POLL_MAX_ATTEMPTS || 10);
    const baseDelay = Number(process.env.POLL_BASE_DELAY_MS || 300);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt - 1)));
        try {
            const { data } = await axios.get(
                `${OPENAI_URL}/threads/${threadId}/runs/${runId}`,
                { headers: HEADERS }
            );

            if (["completed", "failed", "cancelled", "expired"].includes(data.status)) {
                return data;
            }
        } catch (err) {
            logger.error(`Run status check failed (attempt ${attempt}): ${err.message}`);
            if (attempt === maxAttempts) throw err;
        }
    }
    throw new Error("Max polling attempts reached");
}

async function getLastAssistantMessage(threadId) {
    const { data } = await axios.get(`${OPENAI_URL}/threads/${threadId}/messages`, { headers: HEADERS });
    return data.data.find(m => m.role === 'assistant');
}

function parseResponse(content) {
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch || !jsonMatch[1]) return { text: content, quick_replies: [], entities: {} };
    try {
        return JSON.parse(jsonMatch[1]);
    } catch (err) {
        logger.error("Error parsing assistant response JSON", { err });
        return { text: content, quick_replies: [], entities: {} };
    }
}

async function getAssistantReply(senderId, prompt) {
    const threadId = await getOrCreateThread(senderId);
    return await lockThread(threadId, async () => {
        const runId = await sendMessage(threadId, prompt);
        const runData = await waitForRunCompletion(threadId, runId);
        if (runData.status !== 'completed') {
            throw new Error(`Run failed with status: ${runData.status}`);
        }
        const lastMessage = await getLastAssistantMessage(threadId);
        const content = lastMessage.content[0].text.value;
        const response = parseResponse(content);
        await dynamoService.addTokenUsage(runData.usage?.prompt_tokens || 0, runData.usage?.completion_tokens || 0, senderId);
        return response;
    });
}

module.exports = {
    getOrCreateThread,
    getAssistantReply,
};
