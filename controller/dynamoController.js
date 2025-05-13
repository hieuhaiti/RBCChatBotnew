const dynamoService = require('../service/dynamoService');

// Customers
// Lưu thông tin khách hàng
async function saveCustomer(req, res) {
    try {
        const { entities, senderId } = req.body;
        const savedCustomer = await dynamoService.saveCustomerInfo(entities, senderId);
        res.status(201).json(savedCustomer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Lấy thông tin khách hàng
async function getCustomer(req, res) {
    try {
        const { senderId } = req.params;
        const customer = await dynamoService.getCustomerInfo(senderId);
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Xóa thông tin khách hàng
async function deleteCustomer(req, res) {
    try {
        const { senderId } = req.params;
        await dynamoService.deleteCustomerInfo(senderId);
        res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Prompts
// Lưu prompt
async function savePrompt(req, res) {
    try {
        const { prompt } = req.body;
        await dynamoService.savePrompt(prompt);
        res.status(200).json({ message: 'Prompt saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Lấy prompt
async function getPrompt(req, res) {
    try {
        const prompt = await dynamoService.getPrompt();
        res.status(200).json({ prompt });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Xóa prompt
async function deletePrompt(req, res) {
    try {
        const { promptId } = req.params;
        await dynamoService.deletePrompt(promptId);
        res.status(200).json({ message: 'Prompt deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// FAQs
// Lưu FAQ
async function saveFAQ(req, res) {
    try {
        const { faq } = req.body;
        await dynamoService.saveFAQ(faq);
        res.status(200).json({ message: 'FAQ saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Lấy FAQ
async function getFAQ(req, res) {
    try {
        const faqs = await dynamoService.getFAQs();
        res.status(200).json(faqs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
// Xóa FAQ
async function deleteFAQ(req, res) {
    try {
        const { faqId } = req.params;
        await dynamoService.deleteFAQ(faqId);
        res.status(200).json({ message: 'FAQ deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// TokenUsage
// Lấy token usage
async function getTokenUsage(req, res) {
    try {
        const { token_id } = req.params;
        const tokenUsage = await dynamoService.getTokenUsage(token_id);
        res.status(200).json(tokenUsage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Thêm token usage
async function addTokenUsage(req, res) {
    try {
        const { promptTokens, completionTokens, senderId } = req.body;
        await dynamoService.addTokenUsage(promptTokens, completionTokens, senderId);
        res.status(200).json({ message: 'Token usage logged successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    saveCustomer,
    getCustomer,
    deleteCustomer,
    savePrompt,
    getPrompt,
    deletePrompt,
    saveFAQ,
    getFAQ,
    deleteFAQ,
    getTokenUsage,
    addTokenUsage,
};