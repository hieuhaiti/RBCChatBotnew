const dynamoService = require('../service/dynamoService');
const logger = require("../service/utils/Logger");

// GET /rbc/:table/:id - Lấy 1 item theo khóa chính
async function getItem(req, res) {
    const { table, id } = req.params;

    try {
        let key;

        // Ánh xạ bảng với cấu trúc khóa chính
        const keySchemaMap = {
            UsersRBC: { userID: id },
            CustomersRBC: { customerID: id, pageID: req.query.pageID }, // Yêu cầu pageID từ query
            PagesRBC: { pageID: id },
            SubscriptionsRBC: { subscriptionID: id },
            TokenUsageRBC: { usageID: id, timestamp: req.query.timestamp }, // Yêu cầu timestamp từ query
            FAQsRBC: {
                faqID: id,
                assistantID: req.query.assistantID, // Dùng query hoặc default
            },
            AssistantsRBC: { assistantID: id },
        };

        // Kiểm tra bảng có tồn tại trong schemaMap
        if (!keySchemaMap[table]) {
            return res.status(400).json({ error: `Invalid table name: ${table}` });
        }

        key = keySchemaMap[table];

        // Kiểm tra xem tất cả các khóa cần thiết có được cung cấp không
        if (table === 'CustomersRBC' && !key.pageID) {
            return res.status(400).json({ error: 'Missing pageID in query parameters' });
        }
        if (table === 'TokenUsageRBC' && !key.timestamp) {
            return res.status(400).json({ error: 'Missing timestamp in query parameters' });
        }
        if (table === 'FAQsRBC' && !key.assistantID) {
            return res.status(400).json({ error: 'Missing assistantID in query parameters' });
        }

        const item = await dynamoService.getItem(table, key);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item);
    } catch (error) {
        logger?.error?.("Get item error", error);
        if (error.name === 'ValidationException') {
            return res.status(400).json({ error: 'Invalid key provided: ' + error.message });
        }
        res.status(500).json({ error: error.message });
    }
}

// POST /rbc/:table - Thêm item
async function putItem(req, res) {
    const { table } = req.params;
    try {
        const item = await dynamoService.putItem(table, req.body);
        res.status(200).json(item);
    } catch (error) {
        logger?.error?.("Put item error", error);
        res.status(500).json({ error: error.message });
    }
}

// DELETE /rbc/:table - Xóa item
async function deleteItem(req, res) {
    const { table } = req.params;
    try {
        await dynamoService.deleteItem(table, req.body); // truyền Key từ body
        res.status(200).json({ message: 'Deleted' });
    } catch (error) {
        logger?.error?.("Delete item error", error);
        res.status(500).json({ error: error.message });
    }
}

// GET /rbc/scan/:table - Quét tất cả item trong bảng
async function scanTable(req, res) {
    const { table } = req.params;
    try {
        const items = await dynamoService.scanTable(table);
        res.json(items);
    } catch (error) {
        logger?.error?.("Scan table error", error);
        res.status(500).json({ error: error.message });
    }
}

// POST /rbc/query - Truy vấn theo GSI
async function queryByIndex(req, res) {
    const { tableName, indexName, keyName, keyValue, rangeKeyName, rangeKeyValue } = req.body;
    try {
        const result = await dynamoService.queryByIndex(
            tableName, indexName, keyName, keyValue, rangeKeyName, rangeKeyValue
        );
        res.json(result);
    } catch (error) {
        logger?.error?.("Query error", error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getItem,
    putItem,
    deleteItem,
    scanTable,
    queryByIndex,
};