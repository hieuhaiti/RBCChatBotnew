const axios = require("axios");
const dynamoService = require("./dynamoService");
const logger = require("../service/utils/Logger");
const uuid = require("uuid").v4;

const threadLocks = new Set();

const HEADERS = {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    "OpenAI-Beta": "assistants=v2",
    "Content-Type": "application/json",
};

const OPENAI_URL = process.env.OPENAI_URL;
const INSTRUCTION_SYSTEM = process.env.INSTRUCTION_SYSTEM;

async function createdThread() {
    const { data } = await axios.post(`${OPENAI_URL}/threads`, {}, { headers: HEADERS });
    return data.id;
}

async function getMessages(threadId) {
    const { data } = await axios.get(`${OPENAI_URL}/threads/${threadId}/messages`, { headers: HEADERS });
    return data;
}

async function getAssistant(pageId) {
    const page = await dynamoService.getItem("PagesRBC", { pageID: pageId });
    if (!page || !page.assistantId) {
        throw new Error(`No assistant found for page ${pageId}`);
    }
    const response = await axios.get(`${OPENAI_URL}/assistants/${page.assistantId}`, { headers: HEADERS });
    if (response.status !== 200) {
        throw new Error(`Failed to fetch assistant: ${response.statusText}`);
    }
    return response.data;
}

async function createdAssistant() {
    const response = await axios.post(`${OPENAI_URL}/assistants`, {
        model: 'gpt-4o',
        instructions: INSTRUCTION_SYSTEM,
        description: 'Automatically created assistant for page interactions.'
    }, { headers: HEADERS });

    return response.data.id;
}

async function updateAssistant(assistantId, instructions) {
    if (!assistantId) {
        throw new Error("ASSISTANT_ID is not set in environment variables");
    }
    const response = await axios.post(`${OPENAI_URL}/assistants/${assistantId}`, {
        instructions: instructions,
    }, { headers: HEADERS });
    return response.data.id;
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

async function sendMessage(threadId, role, prompt) {
    const { data } = await axios.post(
        `${OPENAI_URL}/threads/${threadId}/messages`,
        { role: role, content: prompt },
        { headers: HEADERS, timeout: Number(process.env.API_TIMEOUT_MS || 10000) }
    );

    return data.id;
}

async function runsThread(threadId, assistantId) {
    const { data } = await axios.post(
        `${OPENAI_URL}/threads/${threadId}/runs`,
        { assistant_id: assistantId },
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

async function getResponseMessenger(senderId, pageId, prompt) {
    const page = await dynamoService.getItem("PagesRBC", { pageID: pageId });
    let assistantId = page.assistantId;
    if (!assistantId || assistantId === '') {
        assistantId = await createdAssistant();
        await dynamoService.putItem("PagesRBC", { ...page, assistantId, updateAt: new Date().toISOString() });
    }
    let customer = await dynamoService.getItem("CustomersRBC", { customerID: senderId, pageID: pageId });

    let threadId = customer?.threadId;
    if (!threadId || threadId === '') {
        threadId = await createdThread();
        await dynamoService.putItem("CustomersRBC", { ...customer, threadId });
    }
    return await lockThread(threadId, async () => {
        await sendMessage(threadId, 'user', prompt);
        const runId = await runsThread(threadId, assistantId);
        const runData = await waitForRunCompletion(threadId, runId);
        if (runData.status !== 'completed') {
            throw new Error(`Run failed with status: ${runData.status}`);
        }
        const lastMessage = await getLastAssistantMessage(threadId);
        const content = lastMessage.content[0].text.value;
        const response = parseResponse(content);
       
        console.log("Token usage data", {
            prompt_tokens: runData.usage.prompt_tokens,
            total_tokens: runData.usage.total_tokens,
        });
        await dynamoService.putItem("TokenUsageRBC", {
            usageID: uuid(),
            timestamp: new Date().toISOString(),
            pageID: pageId,
            customerID: senderId,
            prompt_tokens: runData.usage.prompt_tokens,
            tokensUsed: runData.usage.total_tokens,
        });
        return response;
    });
}

async function getAssistantReply(assistantId, threadId, message) {
    if (threadId === null)
        threadId = await createdThread();
    return await lockThread(threadId, async () => {
        await sendMessage(threadId, 'user', message);
        const runId = await runsThread(threadId, assistantId);
        const runData = await waitForRunCompletion(threadId, runId);
        if (runData.status !== 'completed') {
            throw new Error(`Run failed with status: ${runData.status}`);
        }
        const lastMessage = await getLastAssistantMessage(threadId);
        const content = lastMessage.content[0].text.value;
        const response = parseResponse(content);
        return response;
    });
}
module.exports = {
    createdThread,
    getMessages,
    sendMessage,
    getAssistant,
    createdAssistant,
    updateAssistant,
    getResponseMessenger,
    getAssistantReply,
};
