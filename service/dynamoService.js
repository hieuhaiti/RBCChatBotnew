
const { ScanCommand, GetCommand, PutCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDB } = require("../config/dynamoModels");
const schemaFields = require("../config/schemaFields");
const systemPrompt = require("../config/systemPrompt");

// getTableData
async function getTableData(tableName) {
    try {
        const params = {
            TableName: tableName,
        };
        const { Items } = await dynamoDB.send(new ScanCommand(params));
        return Items;
    } catch (error) {
        throw new Error(`Error scanning table ${tableName}: ${error.message}`);
    }
}
// Customers
// Chuẩn hóa dữ liệu khách hàng
function normalizeCustomerData(entities, senderId) {
    const item = { id: senderId };
    schemaFields.forEach((field) => {
        if (entities[field.name] !== undefined) {
            item[field.name] = entities[field.name];
        } else if (field.required) {
            item[field.name] =
                field.type === "String" ? "" : field.type === "Number" ? 0 : false;
        }
    });

    item.lastInteraction = new Date().toISOString();
    return item;
}

// Lưu thông tin khách hàng
async function saveCustomerInfo(entities, senderId) {
    const item = normalizeCustomerData(entities, senderId);
    const params = {
        TableName: "Customers",
        Item: item,
    };
    await dynamoDB.send(new PutCommand(params));
    return params.Item;
}

// Lấy thông tin khách hàng
async function getCustomerInfo(senderId) {
    const params = {
        TableName: "Customers",
        Key: { id: senderId },
    };
    const { Item } = await dynamoDB.send(new GetCommand(params));

    if (!Item) {
        return normalizeCustomerData({}, senderId);
    }
    return Item;
}


// Xóa thông tin khách hàng
async function deleteCustomerInfo(senderId) {
    const params = {
        TableName: "Customers",
        Key: { id: senderId },
    };
    await dynamoDB.send(new DeleteCommand(params));
}

// Prompts
// Lưu prompt
async function savePrompt(prompt) {
    const params = {
        TableName: "Prompts",
        Item: {
            id: "current_prompt",
            prompt,
            updatedAt: new Date().toISOString(),
        },
    };
    await dynamoDB.send(new PutCommand(params));
}

// Lấy prompt
async function getPrompt(id) {
    const params = {
        TableName: "Prompts",
        Key: { id: id },
    };
    const { Item } = await dynamoDB.send(new GetCommand(params));
    return (
        Item?.prompt || systemPrompt
    );
}

// Xóa prompt
async function deletePrompt() {
    const params = {
        TableName: "Prompts",
        Key: { id: "current_prompt" },
    };
    await dynamoDB.send(new DeleteCommand(params));
}

// FAQs
// Lưu FAQ
async function saveFAQ(question, response_text, quick_replies, entities = {}) {
    const params = {
        TableName: "FAQs",
        Item: {
            id: `faq_${question}`,
            question,
            response_text,
            quick_replies,
            entities, // Thêm trường entities
            updatedAt: new Date().toISOString(),
        },
    };
    await dynamoDB.send(new PutCommand(params));
}

// Lấy FAQ
async function getFAQ(question) {
    const params = {
        TableName: "FAQs",
        Key: { id: `faq_${question}` },
    };
    const { Item } = await dynamoDB.send(new GetCommand(params));
    return Item;
}

// Xóa FAQ
async function deleteFAQ(faqId) {
    const params = {
        TableName: "FAQs",
        Key: { id: faqId },
    };
    await dynamoDB.send(new DeleteCommand(params));
}
// TokenUsage
// Lấy token usage
async function getTokenUsage(token_id) {
    const params = {
        TableName: "TokenUsage",
        Key: { id: token_id },
    };
    const { Item } = await dynamoDB.send(new GetCommand(params));
    return Item;
}
// Thêm token usage
async function addTokenUsage(promptTokens, completionTokens, senderId) {
    const params = {
        TableName: "TokenUsage",
        Item: {
            id: `token_${new Date().toISOString()}`,
            senderId,
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
            timestamp: new Date().toISOString(),
        },
    };
    await dynamoDB.send(new PutCommand(params));
}

module.exports = {
    getTableData,
    saveCustomerInfo,
    getCustomerInfo,
    deleteCustomerInfo,
    savePrompt,
    getPrompt,
    deletePrompt,
    saveFAQ,
    getFAQ,
    deleteFAQ,
    getTokenUsage,
    addTokenUsage,
};