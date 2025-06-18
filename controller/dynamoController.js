const dynamoService = require('../service/dynamoService');
const logger = require("../service/utils/Logger");

// GET /rbc/:table/:id - Lấy 1 item theo khóa chính (id dạng đơn)
async function getItem(req, res) {
    const { table, id } = req.params;
    try {
        const item = await dynamoService.getItem(table, { [`${table.slice(0, -3).toLowerCase()}ID`]: id }); // ví dụ "UsersRBC" => userID
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item);
    } catch (error) {
        logger?.error?.("Get item error", error);
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
