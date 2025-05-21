const axios = require("axios");

const headers = {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
};

async function createAssistant(name, instructions) {
    const { data } = await axios.post(
        `${OPENAI_URL}/assistants`,
        {
            name,
            instructions,
            model: "gpt-4-1106-preview",
            tools: [],
        },
        { headers }
    );
    return data;
}

async function updateAssistant(assistantId, updates = {}) {
    const { data } = await axios.post(
        `${OPENAI_URL}/assistants/${assistantId}`,
        updates,
        { headers }
    );
    return data;
}

async function deleteAssistant(assistantId) {
    await axios.delete(`${OPENAI_URL}/assistants/${assistantId}`, { headers });
}

async function listAssistants() {

    const { data } = await axios.get(
        `${OPENAI_URL}/assistants`
        , { headers });
    return data.data;
}

module.exports = {
    createAssistant,
    updateAssistant,
    deleteAssistant,
    listAssistants,
};
