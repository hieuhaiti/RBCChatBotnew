const axios = require("axios");
const dynamoService = require("./dynamoService");
const logger = require("../utils/logger");
const dynamoService = require("./dynamoService");

// get threadId
async function getThreadId(senderId) {
    const customer = await getCustomerInfo(senderId);
    if (customer.threadId) {
        return customer.threadId;
    }
    const threadResp = await axios.post(
        `${process.env.OPENAI_URL}/threads`,
        {},
        {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "OpenAI-Beta": "assistants=v2",
            },
        }
    );

    const threadId = threadResp.data.id;
    await dynamoService.saveCustomerInfo({ ...customer, threadId }, senderId);
    return threadId;
}

// Gửi messages đến OpenAI
async function sendMessageToGPT(threadId, prompt) {
    try {
        await axios.post(
            `${process.env.OPENAI_URL}/threads/${threadId}/messages`,
            { role: 'user', content: prompt },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    'OpenAI-Beta': 'assistants=v2',
                },
                timeout: process.env.API_TIMEOUT_MS
            }
        );
    } catch (error) {
        logger.error(`Lỗi gửi tin nhắn đến OpenAI: ${error.message}`, {
            status: error.response?.status,
            data: error.response?.data,
        });
        throw error;
    }
    const response = await axios.post(
        `${process.env.OPENAI_URL}/threads/${threadId}/runs`,
        {
            "assistant_id": process.env.ASSISTANT_ID,
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "OpenAI-Beta": "assistants=v2",
            },
        }
    );

    return response.data.id;
}

// Lấy response từ OpenAI
// Poll run status với exponential backoff.
async function pollRunStatus(threadId, runId) {
    let attempts = 0;
    while (attempts < process.env.POLL_MAX_ATTEMPTS) {
        attempts++;
        const delay = process.env.POLL_MAX_DELAY * Math.pow(2, attempts - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
            const response = await axios.get(`${process.env.OPENAI_URL}/threads/${threadId}/runs/${runId}`, {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    'OpenAI-Beta': 'assistants=v2',
                },
                timeout: process.env.API_TIMEOUT_MS,
            });

            logger.info(`Kiểm tra trạng thái run ${runId}, lần ${attempts}`);

            const status = response.data.status;
            if (['completed', 'failed', 'cancelled', 'expired'].includes(status)) {
                return response.data;
            }

        } catch (error) {
            logger.error(`Lỗi kiểm tra run (lần ${attempts}): ${error.message}`, { stack: error.stack });
            if (attempts === process.env.POLL_MAX_ATTEMPTS) throw error;
        }
    }

    throw new Error('Hết số lần thử kiểm tra trạng thái run');
}

// Lấy tin nhắn cuối cùng của assistant từ thread
async function fetchAssistantMessage(threadId) {
    const res = await axios.get(`${process.env.OPENAI_URL}/threads/${threadId}/messages`, {
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
        },
        timeout: process.env.API_TIMEOUT_MS,
    });

    // const lastAssistantMessage = [...messages].reverse().find(msg => msg.role === 'assistant');
    return res.data.data.find(msg => msg.role === 'assistant');
}

// Parse nội dung phản hồi từ Assistant
function parseAssistantResponse(content) {
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch || !jsonMatch[1]) {
        return { text: content, quick_replies: [], entities: {} };
    }

    try {
        return JSON.parse(jsonMatch[1]);
    } catch (error) {
        logger.error(`Lỗi parse JSON từ Assistant: ${error.message}`, { content: jsonMatch[1] });
        return { text: content, quick_replies: [], entities: {} };
    }
}

async function getAssistantResponse(threadId, senderId, prompt) {
    const runId = await sendMessageToGPT(threadId, prompt);
    const runData = await pollRunStatus(threadId, runId);
    if (runData.status !== 'completed') {
        throw new Error(`Run thất bại với trạng thái: ${runData.status}`);
    }

    const lastMessage = await fetchAssistantMessage(threadId);

    if (!lastMessage) throw new Error('Không tìm thấy phản hồi từ Assistant');

    const content = lastMessage.content[0].text.value;
    logger.info(`Nội dung phản hồi từ Assistant: ${content}`);

    const response = parseAssistantResponse(content);

    const promptTokens = runData.usage?.prompt_tokens || 0;
    const completionTokens = runData.usage?.completion_tokens || 0;

    await dynamoService.addTokenUsage(promptTokens, completionTokens, senderId);

    return response;
}
module.exports = {
    getThreadId,
    sendMessageToGPT,
    getAssistantResponse,
}
